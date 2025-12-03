import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Cache for embeddings to reduce API calls during development
const embeddingCache = new Map<string, number[]>();

/**
 * Generate embeddings using OpenAI's text-embedding-3-small model
 * This model provides 1536-dimensional embeddings
 */
export async function generateOpenAIEmbedding(text: string): Promise<number[]> {
  // Check cache first
  const cacheKey = text.toLowerCase().trim();
  if (embeddingCache.has(cacheKey)) {
    return embeddingCache.get(cacheKey)!;
  }

  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      encoding_format: 'float',
    });

    const embedding = response.data[0].embedding;

    // Cache the result
    embeddingCache.set(cacheKey, embedding);

    return embedding;
  } catch (error) {
    console.error('Error generating OpenAI embedding:', error);
    throw new Error('Failed to generate embedding: ' + (error as Error).message);
  }
}

/**
 * Generate embeddings for multiple texts in batch
 */
export async function generateOpenAIEmbeddingsBatch(texts: string[]): Promise<number[][]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: texts,
      encoding_format: 'float',
    });

    return response.data.map(item => item.embedding);
  } catch (error) {
    console.error('Error generating OpenAI embeddings batch:', error);
    throw new Error('Failed to generate embeddings: ' + (error as Error).message);
  }
}
