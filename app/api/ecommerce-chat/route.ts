import { NextRequest } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MCP_URL = 'https://gcp-us-east4.context-surfaces.redis.io/mcp';
const AGENT_KEY = process.env.MCP_AGENT_KEY ?? '';

// ---------------------------------------------------------------------------
// MCP helpers — JSON-RPC over HTTP
// ---------------------------------------------------------------------------

async function mcpRequest(method: string, params: Record<string, unknown> = {}) {
  const res = await fetch(MCP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-API-Key': AGENT_KEY },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  const data = await res.json() as { result?: unknown; error?: unknown };
  if (data.error) throw new Error(JSON.stringify(data.error));
  return data.result;
}

async function listMcpTools(): Promise<OpenAI.Chat.ChatCompletionTool[]> {
  const result = await mcpRequest('tools/list') as { tools: Array<{ name: string; description: string; inputSchema: unknown }> };
  return result.tools.map((t) => ({
    type: 'function' as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.inputSchema as Record<string, unknown>,
    },
  }));
}

async function callMcpTool(name: string, args: Record<string, unknown>): Promise<string> {
  const result = await mcpRequest('tools/call', { name, arguments: args }) as {
    content?: Array<{ type: string; text: string }>;
  };
  return result?.content?.[0]?.text ?? JSON.stringify(result);
}

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are ShopBot, a friendly e-commerce assistant backed by Redis Cloud Context Retriever.

Field encoding — the catalog stores:
- price    : in cents  → divide by 100 to display dollars (e.g. 34999 = $349.99)
- rating   : ×10       → divide by 10 to display stars  (e.g. 48 = ★4.8)

When filtering by price range, convert dollars to cents (e.g. "under $100" → max_value=10000).
When filtering by rating range, multiply by 10 (e.g. "above 4.5 stars" → min_value=45).

Tool guide:
- filter_product_by_category   : browse Electronics, Clothing, Furniture, Books, Sports
- find_product_by_price_range  : filter by budget (values in cents)
- find_product_by_rating_range : find top-rated items (values ×10)
- find_product_by_stock_range  : check availability
- search_product_by_text       : keyword search on name and description
- get_product_by_id            : full details for one product

Always show price as $X.XX and rating as ★X.X. Mention low stock (< 10 units).`;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

type ToolCall = {
  tool: string;
  args: Record<string, unknown>;
  result: string;
};

type StreamEvent =
  | { type: 'status'; phase: 'llm'; iteration: number }
  | { type: 'status'; phase: 'tool'; tool: string; args: Record<string, unknown> }
  | { type: 'result'; success: true; response: string; toolCalls: ToolCall[] }
  | { type: 'result'; success: false; error: string };

// ---------------------------------------------------------------------------
// POST /api/ecommerce-chat  — NDJSON streaming
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: StreamEvent) => {
        controller.enqueue(encoder.encode(JSON.stringify(event) + '\n'));
      };

      try {
        const { message, history = [] } = await request.json() as {
          message: string;
          history: Message[];
        };

        const tools = await listMcpTools();

        const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
          { role: 'system', content: SYSTEM_PROMPT },
          ...history.map((m) => ({ role: m.role, content: m.content })),
          { role: 'user', content: message },
        ];

        const toolCalls: ToolCall[] = [];
        let iteration = 0;

        // Agentic loop — emit status events as each phase starts
        while (true) {
          iteration++;
          send({ type: 'status', phase: 'llm', iteration });

          const response = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL ?? 'gpt-4o',
            messages,
            tools,
            tool_choice: 'auto',
          });

          const choice = response.choices[0];
          messages.push(choice.message);

          if (choice.finish_reason !== 'tool_calls' || !choice.message.tool_calls) {
            send({
              type: 'result',
              success: true,
              response: choice.message.content ?? '',
              toolCalls,
            });
            controller.close();
            return;
          }

          // Execute each tool call — emit a status event per tool
          for (const tc of choice.message.tool_calls) {
            const fn = (tc as OpenAI.Chat.ChatCompletionMessageFunctionToolCall).function;
            const args = JSON.parse(fn.arguments) as Record<string, unknown>;

            send({ type: 'status', phase: 'tool', tool: fn.name, args });

            const result = await callMcpTool(fn.name, args);
            toolCalls.push({ tool: fn.name, args, result });

            messages.push({ role: 'tool', tool_call_id: tc.id, content: result });
          }
        }
      } catch (error) {
        console.error('[ecommerce-chat]', error);
        send({ type: 'result', success: false, error: (error as Error).message });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'application/x-ndjson' },
  });
}
