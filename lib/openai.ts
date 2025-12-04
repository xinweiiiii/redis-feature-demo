import OpenAI from 'openai';

let openaiClient: OpenAI | null = null;

export function getOpenAIClient() {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }

    openaiClient = new OpenAI({
      apiKey: apiKey,
    });
  }

  return openaiClient;
}

export async function createEmbedding(text: string): Promise<number[]> {
  const client = getOpenAIClient();

  const response = await client.embeddings.create({
    model: 'text-embedding-3-small', // Cost-effective embedding model
    input: text,
  });

  return response.data[0].embedding;
}

export async function createChatCompletion(prompt: string): Promise<{
  response: string;
  tokens: number;
  promptTokens: number;
  completionTokens: number;
  model: string;
}> {
  const client = getOpenAIClient();

  // Use model from environment variable or default to gpt-4o-mini
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  const completion = await client.chat.completions.create({
    model: model,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    max_completion_tokens: 4000, // Increased for reasoning models (gpt-5/o1) which use reasoning tokens internally
  });

  console.log('[OpenAI] Full completion object:', JSON.stringify(completion, null, 2));
  console.log('[OpenAI] First choice:', completion.choices[0]);
  console.log('[OpenAI] Message content:', completion.choices[0]?.message?.content);
  console.log('[OpenAI] Finish reason:', completion.choices[0]?.finish_reason);

  const responseContent = completion.choices[0]?.message?.content || '';

  if (!responseContent) {
    console.error('[OpenAI] WARNING: Empty response received!');
    console.error('[OpenAI] Choices:', completion.choices);
  }

  return {
    response: responseContent,
    tokens: completion.usage?.total_tokens || 0,
    promptTokens: completion.usage?.prompt_tokens || 0,
    completionTokens: completion.usage?.completion_tokens || 0,
    model: completion.model,
  };
}

// Calculate cosine similarity between two vectors
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));

  return dotProduct / (magnitudeA * magnitudeB);
}

// Pricing information (as of 2024)
export const PRICING = {
  'gpt-4o-mini': {
    input: 0.150 / 1_000_000,  // $0.150 per 1M input tokens
    output: 0.600 / 1_000_000, // $0.600 per 1M output tokens
  },
  'text-embedding-3-small': {
    usage: 0.020 / 1_000_000,  // $0.020 per 1M tokens
  },
};

export function calculateCost(tokens: number, model: string, type: 'input' | 'output' | 'usage' = 'usage'): number {
  const pricing = PRICING[model as keyof typeof PRICING];
  if (!pricing) return 0;

  if ('usage' in pricing) {
    return tokens * pricing.usage;
  } else if ('input' in pricing && 'output' in pricing) {
    if (type === 'usage') {
      // For chat models, estimate 50/50 split
      return tokens * (pricing.input + pricing.output) / 2;
    }
    return tokens * pricing[type];
  }

  return 0;
}
