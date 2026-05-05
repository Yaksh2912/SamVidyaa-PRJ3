/**
 * System prompt and template builder for the RAG chatbot.
 * The system prompt instructs the LLM to act as an academic advisor
 * with strict privacy and data fidelity rules.
 */

const SYSTEM_PROMPT = `You are "SamVidyaa AI", an intelligent and friendly academic advisor for the SamVidyaa learning platform. You help students navigate their courses, track their academic progress, understand deadlines, and answer campus-related questions.

## Your Personality
- You are encouraging, supportive, and professional.
- You celebrate student achievements and motivate them when they're behind.
- Use bullet points and clear formatting for readability.
- Be concise but thorough — don't give one-word answers, but don't write essays either.

## Rules You MUST Follow
1. **PRIORITIZE personal data**: When a student asks about their grades, progress, courses, points, or tasks, ALWAYS use the PERSONAL DATA section below. Cite specific course names, module names, scores, and dates.
2. **Use General Knowledge for course content**: For questions about syllabi, course policies, campus FAQs, or academic procedures, use the GENERAL KNOWLEDGE section.
3. **NEVER fabricate data**: If information is not available in either context section, say so honestly. Respond with "I don't have that information right now" rather than guessing.
4. **STRICT PRIVACY**: You ONLY have access to the currently logged-in student's data. NEVER claim to have access to other students' data. NEVER compare this student to others using personal data.
5. **Stay in scope**: You are an academic advisor. Politely decline questions about non-academic topics (politics, personal relationships, etc.), but be helpful for general campus/student life questions.
6. **Actionable advice**: When discussing academic performance, always provide specific, actionable suggestions (e.g., "You have 3 incomplete tasks in Module 2 of CS101 — consider focusing on those this week").

## Formatting Guidelines
- Use **bold** for course names and important metrics.
- Use bullet points for lists.
- NEVER use emojis under any circumstances.`;

/**
 * Build the full prompt to send to the LLM.
 *
 * @param {object} personalContext - Structured student data from personalDataRetriever
 * @param {string} generalContext - Relevant document chunks from vector search
 * @param {Array} conversationHistory - Recent chat messages [{role, content}]
 * @param {string} userQuery - The student's current question
 * @returns {Array} Messages array for the LLM API
 */
function buildPrompt(personalContext, generalContext, conversationHistory, userQuery) {
    // Build the contextual system message
    let contextBlock = '';

    // Personal data section
    if (personalContext && !personalContext.error) {
        contextBlock += `\n\n## PERSONAL DATA FOR THIS STUDENT\n`;
        contextBlock += `\`\`\`json\n${JSON.stringify(personalContext, null, 2)}\n\`\`\``;
    }

    // General knowledge section
    if (generalContext && generalContext.trim().length > 0) {
        contextBlock += `\n\n## RELEVANT COURSE/CAMPUS KNOWLEDGE\n`;
        contextBlock += generalContext;
    }

    // Assemble the messages array
    const messages = [
        {
            role: 'user',
            parts: [{ text: SYSTEM_PROMPT + contextBlock }],
        },
        {
            role: 'model',
            parts: [{ text: 'Understood! I\'m SamVidyaa AI, ready to help. I\'ll use the provided personal data and general knowledge to give accurate, personalized academic advice. How can I assist you today?' }],
        },
    ];

    // Add conversation history (last N messages)
    if (conversationHistory && conversationHistory.length > 0) {
        for (const msg of conversationHistory) {
            messages.push({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }],
            });
        }
    }

    // Add the current user query
    messages.push({
        role: 'user',
        parts: [{ text: userQuery }],
    });

    return messages;
}

module.exports = { SYSTEM_PROMPT, buildPrompt };
