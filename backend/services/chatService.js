const { GoogleGenerativeAI } = require('@google/generative-ai');
const ChatMessage = require('../models/ChatMessage');
const { getStudentContext, getStudentSummary } = require('./personalDataRetriever');
const { SYSTEM_PROMPT } = require('./promptTemplates');
const { semanticSearch } = require('./vectorStore');
const chatCache = require('./chatCache');

let model = null;

// Gemini config — read inside init, NOT at module level,
// because this file is require()'d before dotenv.config() in server.js
let LLM_MODEL, LLM_API_KEY;

// Per-student rate limiting
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 10000;
const GLOBAL_RATE_LIMIT_MS = 2500;
let lastGlobalRequest = 0;

/**
 * Initialize the LLM client (Gemini).
 */
function initChatService() {
    LLM_MODEL = process.env.LLM_MODEL || 'gemini-2.5-flash-lite';
    LLM_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.LLM_API_KEY;

    if (!LLM_API_KEY) {
        console.warn('[ChatService] GEMINI_API_KEY/GOOGLE_API_KEY not set — chatbot will not be functional.');
        return false;
    }

    const genAI = new GoogleGenerativeAI(LLM_API_KEY);
    model = genAI.getGenerativeModel({
        model: LLM_MODEL,
        systemInstruction: SYSTEM_PROMPT,
    });

    console.log(`[ChatService] LLM initialized: ${LLM_MODEL} via Google Gemini`);
    return true;
}

/**
 * Detect if the query is about personal student data.
 */
function isPersonalQuery(query) {
    const keywords = [
        'my ', 'i am', 'i\'m', 'i have', 'how am i', 'my grade', 'my score',
        'my course', 'my point', 'my progress', 'my task', 'my module',
        'enrolled', 'enrollment', 'my rank', 'my performance',
        'am i doing', 'my deadline', 'my assignment', 'my reward',
        'what did i', 'have i completed', 'how many point',
    ];
    const lower = query.toLowerCase();
    return keywords.some(kw => lower.includes(kw));
}

/**
 * Check rate limits. Returns a message string if limited, null if OK.
 */
function checkRateLimit(studentId) {
    const now = Date.now();

    if (now - lastGlobalRequest < GLOBAL_RATE_LIMIT_MS) {
        return '⏳ Please wait a moment before sending another message.';
    }

    const lastRequest = rateLimitMap.get(studentId);
    if (lastRequest && now - lastRequest < RATE_LIMIT_WINDOW_MS) {
        const waitSec = Math.ceil((RATE_LIMIT_WINDOW_MS - (now - lastRequest)) / 1000);
        return `⏳ Please wait ${waitSec} seconds before sending another message.`;
    }

    return null;
}

function buildContextBlock(personalContext, generalContext) {
    let contextBlock = '';

    if (personalContext && !personalContext.error && !personalContext.summary) {
        contextBlock += `## PERSONAL DATA FOR THIS STUDENT\n\`\`\`json\n${JSON.stringify(personalContext, null, 2)}\n\`\`\``;
    } else if (personalContext?.summary) {
        contextBlock += `## STUDENT SUMMARY\n${personalContext.summary}`;
    }

    if (generalContext && generalContext.trim().length > 0) {
        contextBlock += `${contextBlock ? '\n\n' : ''}## RELEVANT COURSE/CAMPUS KNOWLEDGE\n${generalContext}`;
    }

    return contextBlock;
}

/**
 * Build the contents array in Gemini format.
 */
function buildContents(personalContext, generalContext, conversationHistory, userQuery) {
    const contents = [];
    const contextBlock = buildContextBlock(personalContext, generalContext);

    if (contextBlock) {
        contents.push({
            role: 'user',
            parts: [{ text: `Use this context for the conversation.\n\n${contextBlock}` }],
        });
        contents.push({
            role: 'model',
            parts: [{ text: 'Understood. I will use the supplied context and follow the instructions exactly.' }],
        });
    }

    if (conversationHistory && conversationHistory.length > 0) {
        for (const msg of conversationHistory) {
            contents.push({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }],
            });
        }
    }

    contents.push({
        role: 'user',
        parts: [{ text: userQuery }],
    });

    return contents;
}

function extractSources(generalContext) {
    const sources = [];

    if (generalContext && generalContext.trim().length > 0) {
        const sourceMatches = generalContext.match(/\[([^\]]+)\]/g);
        if (sourceMatches) {
            sources.push(...new Set(sourceMatches.map((source) => source.replace(/[\[\]]/g, ''))));
        }
    }

    return sources;
}

/**
 * Main chat handler.
 */
async function handleChatMessage(studentId, message) {
    if (!model) {
        throw new Error('Chat service not initialized. Set GEMINI_API_KEY or GOOGLE_API_KEY in your .env file.');
    }

    // 1. Check rate limit
    const rateLimitMsg = checkRateLimit(studentId);
    if (rateLimitMsg) {
        return { reply: rateLimitMsg, sources: [], cached: false };
    }

    // 2. Check cache
    const cached = chatCache.get(studentId, message);
    if (cached) {
        console.log('[ChatService] Cache hit — skipping API call.');
        return { reply: cached.reply, sources: cached.sources, cached: true };
    }

    // 3. Record timestamps
    const now = Date.now();
    rateLimitMap.set(studentId, now);
    lastGlobalRequest = now;

    // 4. Get conversation history (last 6 messages)
    const recentHistory = await ChatMessage.find({ student_id: studentId })
        .sort({ createdAt: -1 })
        .limit(6)
        .lean();

    const conversationHistory = recentHistory.reverse().map((msg) => ({
        role: msg.role,
        content: msg.content,
    }));

    // 5. Smart context loading
    let personalContext;
    if (isPersonalQuery(message)) {
        personalContext = await getStudentContext(studentId);
    } else {
        const summary = await getStudentSummary(studentId);
        personalContext = { summary };
    }

    // Vector search (gracefully skipped if not available)
    let generalContext = '';
    if (message.length > 15) {
        generalContext = await semanticSearch(message, 2);
    }

    // 6. Build contents and call Gemini
    const contents = buildContents(personalContext, generalContext, conversationHistory, message);
    const sources = extractSources(generalContext);
    let reply = '';
    const MAX_RETRIES = 2;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            const result = await model.generateContent({
                contents,
                generationConfig: {
                    temperature: 0.3,
                    topP: 0.9,
                    maxOutputTokens: 800,
                },
            });

            reply = result.response?.text?.() || 'I couldn\'t generate a response. Please try again.';
            break;
        } catch (error) {
            const errorMessage = error.message?.substring(0, 200) || 'Unknown Gemini error';
            console.error(`[ChatService] LLM error (attempt ${attempt + 1}):`, errorMessage);

            const is429 = error.status === 429
                || errorMessage.includes('429')
                || errorMessage.toLowerCase().includes('rate')
                || errorMessage.toLowerCase().includes('quota');

            if (is429 && attempt < MAX_RETRIES) {
                const waitMs = Math.pow(2, attempt + 1) * 1000;
                console.log(`[ChatService] Rate limited. Retrying in ${waitMs / 1000}s...`);
                await new Promise((resolve) => setTimeout(resolve, waitMs));
                continue;
            }

            if (is429) {
                reply = '⏳ The AI service is temporarily rate-limited. Please try again in a moment.';
            } else {
                reply = 'I encountered an issue processing your request. Please try again shortly.';
            }
        }
    }

    // 7. Cache the response
    if (reply && !reply.startsWith('⏳')) {
        chatCache.set(studentId, message, { reply, sources });
    }

    // 8. Save to database
    await ChatMessage.create([
        { student_id: studentId, role: 'user', content: message },
        { student_id: studentId, role: 'assistant', content: reply, sources },
    ]);

    return { reply, sources, cached: false };
}

/**
 * Get paginated chat history.
 */
async function getChatHistory(studentId, limit = 50, skip = 0) {
    return ChatMessage.find({ student_id: studentId })
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .lean();
}

/**
 * Clear chat history.
 */
async function clearChatHistory(studentId) {
    await ChatMessage.deleteMany({ student_id: studentId });
    chatCache.clearForStudent(studentId);
}

module.exports = {
    initChatService,
    handleChatMessage,
    getChatHistory,
    clearChatHistory,
};
