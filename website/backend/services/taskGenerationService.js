const { GoogleGenerativeAI, SchemaType } = require('@google/generative-ai');

let model = null;
let LLM_MODEL;

const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'];
const SUPPORTED_LANGUAGES = ['Python', 'JavaScript', 'Java', 'C++'];
const MAX_TASKS = 10;

// JSON schema the model must conform to. Mirrors the Task model fields a
// teacher edits in CreateTaskForm.
const RESPONSE_SCHEMA = {
    type: SchemaType.OBJECT,
    properties: {
        tasks: {
            type: SchemaType.ARRAY,
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    task_name: { type: SchemaType.STRING },
                    problem_statement: { type: SchemaType.STRING },
                    expected_output: { type: SchemaType.STRING },
                    sample_input: { type: SchemaType.STRING },
                    sample_output: { type: SchemaType.STRING },
                    constraints: { type: SchemaType.STRING },
                    difficulty: { type: SchemaType.STRING, enum: DIFFICULTIES },
                    points: { type: SchemaType.NUMBER },
                    time_limit: { type: SchemaType.NUMBER },
                    language: { type: SchemaType.STRING },
                    test_cases: {
                        type: SchemaType.ARRAY,
                        items: {
                            type: SchemaType.OBJECT,
                            properties: {
                                input: { type: SchemaType.STRING },
                                expected_output: { type: SchemaType.STRING },
                                is_sample: { type: SchemaType.BOOLEAN },
                            },
                            required: ['input', 'expected_output'],
                        },
                    },
                },
                required: ['task_name', 'problem_statement'],
            },
        },
    },
    required: ['tasks'],
};

/**
 * Initialize the task-generation LLM client (Gemini).
 * Read config inside init (not at module load) because this file is
 * require()'d before dotenv.config() runs in server.js.
 */
function initTaskGenerationService() {
    LLM_MODEL = process.env.LLM_MODEL || 'gemini-2.5-flash-lite';
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.LLM_API_KEY;

    if (!apiKey) {
        console.warn('[TaskGen] GEMINI_API_KEY/GOOGLE_API_KEY not set — AI task generation disabled.');
        return false;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({ model: LLM_MODEL });

    console.log(`[TaskGen] AI task generation initialized: ${LLM_MODEL} via Google Gemini`);
    return true;
}

function isReady() {
    return model !== null;
}

const clampInt = (value, min, max, fallback) => {
    const number = Math.round(Number(value));
    if (!Number.isFinite(number)) return fallback;
    return Math.min(max, Math.max(min, number));
};

const normalizeLanguage = (value) => {
    const match = SUPPORTED_LANGUAGES.find((lang) => lang.toLowerCase() === String(value || '').trim().toLowerCase());
    return match || 'Python';
};

const normalizeDifficulty = (value) => {
    const upper = String(value || '').trim().toUpperCase();
    return DIFFICULTIES.includes(upper) ? upper : 'MEDIUM';
};

// Coerce a raw model task into the exact shape CreateTaskForm/createTask expect.
const normalizeDraft = (raw, fallbackLanguage, fallbackDifficulty) => {
    const testCases = Array.isArray(raw.test_cases) ? raw.test_cases : [];
    const normalizedTestCases = testCases
        .filter((tc) => tc && String(tc.input ?? '').trim() && String(tc.expected_output ?? '').trim())
        .map((tc, index) => ({
            input: String(tc.input).trim(),
            expected_output: String(tc.expected_output).trim(),
            is_sample: typeof tc.is_sample === 'boolean' ? tc.is_sample : index === 0,
            order_index: index + 1,
        }));

    return {
        task_name: String(raw.task_name || '').trim(),
        problem_statement: String(raw.problem_statement || '').trim(),
        expected_output: String(raw.expected_output || '').trim(),
        sample_input: String(raw.sample_input || '').trim(),
        sample_output: String(raw.sample_output || '').trim(),
        constraints: String(raw.constraints || '').trim(),
        difficulty: raw.difficulty ? normalizeDifficulty(raw.difficulty) : fallbackDifficulty,
        points: clampInt(raw.points, 1, 1000, 10),
        time_limit: clampInt(raw.time_limit, 1, 600, 30),
        language: raw.language ? normalizeLanguage(raw.language) : fallbackLanguage,
        allow_collaboration: false,
        collab_percentage: 50,
        test_cases: normalizedTestCases,
        test_cases_count: normalizedTestCases.length,
    };
};

function buildPrompt({ prompt, count, difficulty, language, moduleName, moduleDescription }) {
    const lines = [
        'You are an expert programming instructor creating coding lab tasks for students.',
        `Generate exactly ${count} distinct coding task${count === 1 ? '' : 's'}.`,
    ];

    if (moduleName) {
        lines.push(`These tasks belong to the module "${moduleName}".`);
    }
    if (moduleDescription) {
        lines.push(`Module description: ${moduleDescription}`);
    }
    if (difficulty) {
        lines.push(`Target difficulty: ${normalizeDifficulty(difficulty)}.`);
    }
    if (language) {
        lines.push(`Primary programming language: ${normalizeLanguage(language)}.`);
    }

    lines.push(
        '',
        'Teacher instructions:',
        prompt,
        '',
        'Requirements for every task:',
        '- task_name: a short, descriptive title.',
        '- problem_statement: a clear, self-contained description of what the student must implement.',
        '- sample_input and sample_output: one representative example each (plain text).',
        '- test_cases: 2 to 4 cases with concrete input and expected_output. Mark at least one as is_sample: true.',
        '- Keep difficulty, points, and time_limit sensible and consistent with the requested difficulty.',
        'Return only the structured JSON described by the schema.',
    );

    return lines.join('\n');
}

/**
 * Generate one or more task drafts. Drafts are NOT persisted — they are
 * returned for the teacher to review and edit before saving.
 */
async function generateTasks({ prompt, count = 1, difficulty, language, moduleName = '', moduleDescription = '' }) {
    if (!model) {
        throw new Error('AI task generation is not configured. Set GEMINI_API_KEY or GOOGLE_API_KEY in your .env file.');
    }

    const safeCount = clampInt(count, 1, MAX_TASKS, 1);
    const fallbackLanguage = language ? normalizeLanguage(language) : 'Python';
    const fallbackDifficulty = difficulty ? normalizeDifficulty(difficulty) : 'MEDIUM';

    const text = buildPrompt({
        prompt,
        count: safeCount,
        difficulty,
        language,
        moduleName,
        moduleDescription,
    });

    const MAX_RETRIES = 2;
    let lastError = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            const result = await model.generateContent({
                contents: [{ role: 'user', parts: [{ text }] }],
                generationConfig: {
                    temperature: 0.7,
                    topP: 0.9,
                    maxOutputTokens: 4096,
                    responseMimeType: 'application/json',
                    responseSchema: RESPONSE_SCHEMA,
                },
            });

            const responseText = result.response?.text?.() || '';
            const parsed = JSON.parse(responseText);
            const rawTasks = Array.isArray(parsed.tasks) ? parsed.tasks : [];

            return rawTasks
                .slice(0, safeCount)
                .map((raw) => normalizeDraft(raw, fallbackLanguage, fallbackDifficulty))
                .filter((task) => task.task_name && task.problem_statement);
        } catch (error) {
            lastError = error;
            const message = error.message?.substring(0, 200) || 'Unknown Gemini error';
            console.error(`[TaskGen] generation error (attempt ${attempt + 1}):`, message);

            const isRetryable = error.status === 429
                || message.includes('429')
                || message.toLowerCase().includes('rate')
                || message.toLowerCase().includes('quota');

            if (isRetryable && attempt < MAX_RETRIES) {
                const waitMs = Math.pow(2, attempt + 1) * 1000;
                await new Promise((resolve) => setTimeout(resolve, waitMs));
                continue;
            }

            break;
        }
    }

    throw new Error(lastError?.message || 'Failed to generate tasks. Please try again.');
}

module.exports = {
    initTaskGenerationService,
    generateTasks,
    isReady,
};
