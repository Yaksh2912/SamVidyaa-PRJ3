const { Pinecone } = require('@pinecone-database/pinecone');
const { GoogleGenerativeAI } = require('@google/generative-ai');

let pineconeIndex = null;
let embeddingModel = null;

const INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'samvidyaa-docs';
const EMBEDDING_DIMENSION = 768; // text-embedding-004 outputs 768 dimensions

/**
 * Initialize connections to Pinecone and the Google embedding model.
 * Called once at server startup.
 */
async function initVectorStore() {
    try {
        if (!process.env.PINECONE_API_KEY) {
            console.warn('[VectorStore] PINECONE_API_KEY not set — vector search disabled. General knowledge retrieval will be skipped.');
            return false;
        }

        if (!process.env.GOOGLE_API_KEY) {
            console.warn('[VectorStore] GOOGLE_API_KEY not set — embeddings disabled.');
            return false;
        }

        // Initialize Pinecone
        const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
        
        // Check if index exists, create if not
        const indexList = await pc.listIndexes();
        const indexExists = indexList.indexes?.some(idx => idx.name === INDEX_NAME);

        if (!indexExists) {
            console.log(`[VectorStore] Creating Pinecone index: ${INDEX_NAME}`);
            await pc.createIndex({
                name: INDEX_NAME,
                dimension: EMBEDDING_DIMENSION,
                metric: 'cosine',
                spec: {
                    serverless: {
                        cloud: 'aws',
                        region: process.env.PINECONE_REGION || 'us-east-1',
                    },
                },
            });
            // Wait for index to be ready
            console.log('[VectorStore] Waiting for index to initialize...');
            await new Promise(resolve => setTimeout(resolve, 10000));
        }

        pineconeIndex = pc.index(INDEX_NAME);

        // Initialize Google embedding model
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });

        console.log('[VectorStore] Pinecone and embedding model initialized successfully.');
        return true;
    } catch (error) {
        console.error('[VectorStore] Initialization error:', error.message);
        return false;
    }
}

/**
 * Generate an embedding vector for a text string.
 * @param {string} text
 * @returns {number[]} Embedding vector
 */
async function generateEmbedding(text) {
    if (!embeddingModel) {
        throw new Error('Embedding model not initialized. Call initVectorStore() first.');
    }

    const result = await embeddingModel.embedContent(text);
    return result.embedding.values;
}

/**
 * Split a document into chunks of approximately `chunkSize` characters
 * with `overlap` characters of overlap between chunks.
 */
function chunkText(text, chunkSize = 1000, overlap = 200) {
    const chunks = [];
    let start = 0;

    while (start < text.length) {
        const end = Math.min(start + chunkSize, text.length);
        chunks.push(text.slice(start, end));
        start += chunkSize - overlap;
    }

    return chunks;
}

/**
 * Embed and store document chunks in Pinecone.
 *
 * @param {string} documentText - Full text content of the document
 * @param {object} metadata - { source, courseId, courseName, type }
 * @returns {number} Number of chunks stored
 */
async function embedAndStore(documentText, metadata = {}) {
    if (!pineconeIndex) {
        console.warn('[VectorStore] Not initialized — skipping document ingestion.');
        return 0;
    }

    const chunks = chunkText(documentText);
    const vectors = [];

    for (let i = 0; i < chunks.length; i++) {
        const embedding = await generateEmbedding(chunks[i]);

        vectors.push({
            id: `${metadata.source || 'doc'}_chunk_${Date.now()}_${i}`,
            values: embedding,
            metadata: {
                text: chunks[i],
                source: metadata.source || 'unknown',
                courseId: metadata.courseId || '',
                courseName: metadata.courseName || '',
                type: metadata.type || 'general',
                chunkIndex: i,
            },
        });
    }

    // Upsert in batches of 100
    const batchSize = 100;
    for (let i = 0; i < vectors.length; i += batchSize) {
        const batch = vectors.slice(i, i + batchSize);
        await pineconeIndex.upsert({ records: batch });
    }

    console.log(`[VectorStore] Stored ${vectors.length} chunks from: ${metadata.source || 'unknown'}`);
    return vectors.length;
}

/**
 * Delete vectors by metadata filter.
 *
 * @param {object} filter
 * @returns {boolean} Whether a delete was attempted
 */
async function clearVectorsByFilter(filter = {}) {
    if (!pineconeIndex) {
        console.warn('[VectorStore] Not initialized — skipping vector deletion.');
        return false;
    }

    if (!filter || typeof filter !== 'object' || Object.keys(filter).length === 0) {
        throw new Error('A non-empty filter object is required to delete vectors.');
    }

    await pineconeIndex.deleteMany({ filter });
    console.log('[VectorStore] Deleted vectors for filter:', JSON.stringify(filter));
    return true;
}

/**
 * Perform semantic search against the vector store.
 *
 * @param {string} query - The user's search query
 * @param {number} topK - Number of results to return
 * @returns {string} Concatenated text of the top matching chunks
 */
async function semanticSearch(query, topK = 3) {
    if (!pineconeIndex) {
        return ''; // Vector store not available — return empty context
    }

    try {
        let queryEmbedding;
        try {
            queryEmbedding = await generateEmbedding(query);
        } catch (embedError) {
            // If embedding fails (e.g., quota), gracefully skip vector search
            console.warn('[VectorStore] Embedding failed (likely quota):', embedError.message?.substring(0, 100));
            return '';
        }

        const results = await pineconeIndex.query({
            vector: queryEmbedding,
            topK,
            includeMetadata: true,
        });

        if (!results.matches || results.matches.length === 0) {
            return '';
        }

        // Format results as a readable context block
        const contextParts = results.matches
            .filter(match => match.score > 0.5) // Only include relevant results
            .map((match, i) => {
                const meta = match.metadata;
                const source = meta.courseName ? `[${meta.courseName}]` : `[${meta.source}]`;
                return `--- Source ${i + 1}: ${source} (Relevance: ${(match.score * 100).toFixed(1)}%) ---\n${meta.text}`;
            });

        return contextParts.join('\n\n');
    } catch (error) {
        console.error('[VectorStore] Semantic search error:', error.message);
        return '';
    }
}

/**
 * Check if the vector store is available and initialized.
 */
function isReady() {
    return pineconeIndex !== null && embeddingModel !== null;
}

module.exports = {
    initVectorStore,
    generateEmbedding,
    embedAndStore,
    clearVectorsByFilter,
    semanticSearch,
    chunkText,
    isReady,
};
