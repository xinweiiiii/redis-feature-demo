import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';
import { createEmbedding, createChatCompletion, cosineSimilarity, calculateCost } from '@/lib/openai';

const CACHE_KEY_PREFIX = 'semantic-cache:';
const SIMILARITY_THRESHOLD = 0.85; // 85% similarity to consider a cache hit (semantic similarity)

export async function POST(request: NextRequest) {
  try {
    const { query, useCache = true } = await request.json();

    console.log('[Semantic Cache] Query:', query, 'useCache:', useCache);

    if (!query) {
      return NextResponse.json(
        { success: false, error: 'Query is required' },
        { status: 400 }
      );
    }

    const startTime = performance.now();
    const client = await getRedisClient();

    // Create embedding for the query
    const queryEmbedding = await createEmbedding(query);
    const embeddingTime = performance.now() - startTime;

    let cacheHit = false;
    let response = '';
    let tokens = 0;
    let cost = 0;
    let model = '';
    let similarity = 0;
    let cachedQuery = '';

    if (useCache) {
      // Search for similar queries in cache
      const cacheKeys = await client.keys(`${CACHE_KEY_PREFIX}*`);

      let bestMatch: { key: string; similarity: number; } | null = null;

      for (const key of cacheKeys) {
        const cached = await client.hGetAll(key);

        if (cached.embedding) {
          const cachedEmbedding = JSON.parse(cached.embedding);
          const sim = cosineSimilarity(queryEmbedding, cachedEmbedding);

          console.log('[Semantic Cache] Comparing with cached query:', cached.query, 'Similarity:', sim);

          if (sim >= SIMILARITY_THRESHOLD && (!bestMatch || sim > bestMatch.similarity)) {
            bestMatch = { key, similarity: sim };
          }
        }
      }

      // If we found a similar query, return cached response
      if (bestMatch) {
        const cached = await client.hGetAll(bestMatch.key);
        cacheHit = true;
        response = cached.response || '';
        tokens = 0; // No new tokens used
        cost = 0; // No new cost
        model = cached.model || 'cached';
        similarity = bestMatch.similarity;
        cachedQuery = cached.query || '';

        console.log('[Semantic Cache] Cache HIT! Similarity:', similarity);
      }
    }

    // If no cache hit, call OpenAI
    if (!cacheHit) {
      const llmStart = performance.now();
      const completion = await createChatCompletion(query);
      const llmTime = performance.now() - llmStart;

      response = completion.response;
      tokens = completion.tokens;
      model = completion.model;

      // Calculate cost correctly using prompt and completion tokens
      const inputCost = calculateCost(completion.promptTokens, model, 'input');
      const outputCost = calculateCost(completion.completionTokens, model, 'output');
      cost = inputCost + outputCost;

      console.log('[Semantic Cache] Cache MISS - called LLM. Tokens:', tokens, 'Cost:', cost);

      // Store in cache
      if (useCache) {
        const cacheKey = `${CACHE_KEY_PREFIX}${Date.now()}`;
        await client.hSet(cacheKey, {
          query,
          response,
          embedding: JSON.stringify(queryEmbedding),
          tokens: tokens.toString(),
          model,
          timestamp: new Date().toISOString(),
        });

        // Set expiration to 1 hour
        await client.expire(cacheKey, 3600);
      }
    }

    const totalTime = performance.now() - startTime;

    return NextResponse.json({
      success: true,
      query,
      response,
      cacheHit,
      similarity: cacheHit ? similarity : null,
      cachedQuery: cacheHit ? cachedQuery : null,
      tokens: cacheHit ? 0 : tokens,
      cost: cacheHit ? 0 : cost,
      model,
      timing: {
        embedding: embeddingTime,
        total: totalTime,
      },
    });
  } catch (error) {
    console.error('[Semantic Cache] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message,
        isApiKeyError: (error as Error).message.includes('OPENAI_API_KEY')
      },
      { status: 500 }
    );
  }
}
