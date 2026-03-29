const OpenAI = require('openai');
const ChatMessage = require('../models/ChatMessage');
const { getStudentContext, getStudentSummary } = require('./personalDataRetriever');
const { SYSTEM_PROMPT } = require('./promptTemplates');
const { semanticSearch } = require('./vectorStore');
const chatCache = require('./chatCache');

let client = null;

// Groq config — read inside init, NOT at module level,
// because this file is require()'d before dotenv.config() in server.js
let LLM_BASE_URL, LLM_MODEL, LLM_API_KEY;

// Per-student rate limiting
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 10000;
const GLOBAL_RATE_LIMIT_MS = 2500;
let lastGlobalRequest = 0;

/**
 * Initialize the LLM client (Groq via OpenAI-compatible SDK).
 */
function initChatService() {
    // Read env vars HERE (after dotenv.config() has run)
    LLM_BASE_URL = process.env.LLM_BASE_URL || 'https://api.groq.com/openai/v1';
    LLM_MODEL = process.env.LLM_MODEL || 'llama-3.3-70b-versatile';
    LLM_API_KEY = process.env.GROQ_API_KEY || process.env.LLM_API_KEY;

    if (!LLM_API_KEY) {
        console.warn('[ChatService] GROQ_API_KEY not set — chatbot will not be functional.');
        console.warn('[ChatService] Get a free key at: https://console.groq.com/keys');
        return false;
    }

    client = new OpenAI({
        apiKey: LLM_API_KEY,
        baseURL: LLM_BASE_URL,
    });

    console.log(`[ChatService] LLM initialized: ${LLM_MODEL} via ${LLM_BASE_URL}`);
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

/**
 * Build the messages array in OpenAI chat format.
 */
function buildMessages(personalContext, generalContext, conversationHistory, userQuery) {
    // Build context to inject into system prompt
    let contextBlock = '';

    if (personalContext && !personalContext.error && !personalContext.summary) {
        contextBlock += `\n\n## PERSONAL DATA FOR THIS STUDENT\n\`\`\`json\n${JSON.stringify(personalContext, null, 2)}\n\`\`\``;
    } else if (personalContext?.summary) {
        contextBlock += `\n\n## STUDENT SUMMARY\n${personalContext.summary}`;
    }

    if (generalContext && generalContext.trim().length > 0) {
        contextBlock += `\n\n## RELEVANT COURSE/CAMPUS KNOWLEDGE\n${generalContext}`;
    }

    const messages = [
        { role: 'system', content: SYSTEM_PROMPT + contextBlock },
    ];

    // Add conversation history (last few messages)
    if (conversationHistory && conversationHistory.length > 0) {
        for (const msg of conversationHistory) {
            messages.push({
                role: msg.role === 'user' ? 'user' : 'assistant',
                content: msg.content,
            });
        }
    }

    // Add the current user query
    messages.push({ role: 'user', content: userQuery });

    return messages;
}

/**
 * Main chat handler.
 */
async function handleChatMessage(studentId, message) {
    if (!client) {
        throw new Error('Chat service not initialized. Set GROQ_API_KEY in your .env file.');
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

    const conversationHistory = recentHistory.reverse().map(msg => ({
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

    // 6. Build messages and call LLM
    const messages = buildMessages(personalContext, generalContext, conversationHistory, message);

    let reply = '';
    const sources = [];
    const MAX_RETRIES = 2;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            const completion = await client.chat.completions.create({
                model: LLM_MODEL,
                messages,
                temperature: 0.7,
                max_tokens: 800,
            });

            reply = completion.choices[0]?.message?.content || 'I couldn\'t generate a response. Please try again.';

            // Extract source references
            if (generalContext && generalContext.trim().length > 0) {
                const sourceMatches = generalContext.match(/\[([^\]]+)\]/g);
                if (sourceMatches) {
                    sources.push(...new Set(sourceMatches.map(s => s.replace(/[\[\]]/g, ''))));
                }
            }

            break; // Success

        } catch (error) {
            console.error(`[ChatService] LLM error (attempt ${attempt + 1}):`, error.message?.substring(0, 200));

            const is429 = error.status === 429 || error.message?.includes('429') || error.message?.includes('rate');

            if (is429 && attempt < MAX_RETRIES) {
                const waitMs = Math.pow(2, attempt + 1) * 1000;
                console.log(`[ChatService] Rate limited. Retrying in ${waitMs / 1000}s...`);
                await new Promise(resolve => setTimeout(resolve, waitMs));
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
