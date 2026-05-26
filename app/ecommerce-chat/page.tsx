'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: Array<{ tool: string; args: Record<string, unknown>; result: string }>;
};

type AgentPhase =
  | { phase: 'llm'; iteration: number }
  | { phase: 'tool'; tool: string; args: Record<string, unknown> }
  | null;

const SUGGESTED = [
  'Show me noise-cancelling headphones',
  'What furniture do you have under $800?',
  'What are the highest rated books?',
  'Show me all Electronics',
  'Find running shoes in Clothing',
];

// Human-readable tool names
function formatToolName(name: string) {
  return name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// Inline code pill
function Code({ children }: { children: React.ReactNode }) {
  return (
    <code style={{
      background: 'rgba(0,0,0,0.07)', borderRadius: 4, padding: '0 4px',
      fontSize: '0.65rem', fontFamily: 'monospace', color: 'var(--text-primary)',
    }}>{children}</code>
  );
}

// Numbered step card
function Step({
  num, color, title, body, snippet, isLast = false, children,
}: {
  num: string; color: string; title: string;
  body: React.ReactNode; snippet?: string;
  isLast?: boolean; children?: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', gap: '0.6rem' }}>
      {/* Number + connector line */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        <div style={{
          width: 22, height: 22, borderRadius: '50%', background: color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.65rem', fontWeight: 800, color: 'white', flexShrink: 0,
        }}>{num}</div>
        {!isLast && (
          <div style={{ width: 2, flex: 1, background: `${color}30`, marginTop: 4, minHeight: 16 }} />
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, paddingBottom: isLast ? 0 : '0.5rem' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
          {title}
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary, #6b7280)', lineHeight: 1.55 }}>
          {body}
        </div>
        {snippet && (
          <pre style={{
            marginTop: '0.4rem', marginBottom: 0,
            background: 'rgba(0,0,0,0.05)', borderRadius: 6,
            padding: '0.4rem 0.5rem', fontSize: '0.6rem',
            fontFamily: 'monospace', color: 'var(--text-primary)',
            overflowX: 'auto', lineHeight: 1.6,
            borderLeft: `3px solid ${color}`,
          }}>{snippet}</pre>
        )}
        {children}
      </div>
    </div>
  );
}

export default function EcommerceChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm ShopBot 🛍️ — your e-commerce assistant powered by Redis Cloud Context Retriever. Ask me about products, prices, availability, or browse by category!",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [agentPhase, setAgentPhase] = useState<AgentPhase>(null);
  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set());
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, agentPhase]);

  const sendMessage = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput('');
    setLoading(true);
    setAgentPhase(null);

    const userMsg: Message = { role: 'user', content: msg };
    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);

    try {
      const res = await fetch('/api/ecommerce-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          history: messages
            .filter((m) => m.role !== 'assistant' || !m.content.startsWith("Hi!"))
            .map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.body) throw new Error('No response body');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line) as
            | { type: 'status'; phase: 'llm'; iteration: number }
            | { type: 'status'; phase: 'tool'; tool: string; args: Record<string, unknown> }
            | { type: 'result'; success: boolean; response?: string; toolCalls?: Message['toolCalls']; error?: string };

          if (event.type === 'status') {
            if (event.phase === 'llm') {
              setAgentPhase({ phase: 'llm', iteration: event.iteration });
            } else {
              setAgentPhase({ phase: 'tool', tool: event.tool, args: event.args });
            }
          } else if (event.type === 'result') {
            setAgentPhase(null);
            if (event.success) {
              setMessages([
                ...updatedHistory,
                { role: 'assistant', content: event.response ?? '', toolCalls: event.toolCalls },
              ]);
            } else {
              setMessages([...updatedHistory, { role: 'assistant', content: `Error: ${event.error}` }]);
            }
          }
        }
      }
    } catch {
      setAgentPhase(null);
      setMessages([...updatedHistory, { role: 'assistant', content: 'Something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
      setAgentPhase(null);
    }
  };

  const toggleTools = (key: string) => {
    setExpandedTools((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  // ── Phase indicator component ─────────────────────────────────────────────
  const PhaseIndicator = () => {
    if (!agentPhase) return (
      // Fallback dots when loading but no phase yet
      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
        <div style={{
          padding: '0.75rem 1rem', borderRadius: '16px 16px 16px 4px',
          background: 'var(--bg-primary)', boxShadow: 'var(--shadow-sm)',
          display: 'flex', gap: 6, alignItems: 'center',
        }}>
          {[0, 1, 2].map((d) => (
            <div key={d} style={{
              width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-color)',
              animation: 'pulse 1.2s ease-in-out infinite',
              animationDelay: `${d * 0.2}s`,
            }} />
          ))}
        </div>
      </div>
    );

    const isLlm = agentPhase.phase === 'llm';

    return (
      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
        <div style={{
          padding: '0.6rem 1rem',
          borderRadius: '16px 16px 16px 4px',
          background: isLlm
            ? 'linear-gradient(135deg, rgba(220,56,45,0.08) 0%, rgba(192,47,37,0.12) 100%)'
            : 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(37,99,235,0.12) 100%)',
          border: isLlm
            ? '1px solid rgba(220,56,45,0.25)'
            : '1px solid rgba(59,130,246,0.25)',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex', alignItems: 'center', gap: '0.6rem',
          minWidth: 220,
        }}>
          {/* Icon */}
          <div style={{
            width: 28, height: 28, borderRadius: 8, flexShrink: 0,
            background: isLlm
              ? 'linear-gradient(135deg, #dc382d 0%, #c02f25 100%)'
              : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'phasePulse 1.5s ease-in-out infinite',
          }}>
            {isLlm ? (
              /* Sparkle / brain icon for LLM */
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
              </svg>
            ) : (
              /* Wrench icon for tool */
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
              </svg>
            )}
          </div>

          {/* Text */}
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.02em',
              color: isLlm ? 'var(--accent-color)' : '#2563eb',
              marginBottom: 1,
            }}>
              {isLlm ? `GPT-4o · thinking…` : 'Redis MCP · tool call'}
            </div>
            <div style={{
              fontSize: '0.7rem', color: 'var(--text-secondary, #6b7280)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200,
            }}>
              {isLlm
                ? (agentPhase.iteration > 1 ? `Re-evaluating with tool results` : 'Planning which tools to use')
                : formatToolName(agentPhase.tool)}
            </div>
          </div>

          {/* Animated dots */}
          <div style={{ display: 'flex', gap: 3, marginLeft: 'auto', flexShrink: 0 }}>
            {[0, 1, 2].map((d) => (
              <div key={d} style={{
                width: 5, height: 5, borderRadius: '50%',
                background: isLlm ? 'var(--accent-color)' : '#3b82f6',
                animation: 'pulse 1.2s ease-in-out infinite',
                animationDelay: `${d * 0.2}s`,
                opacity: 0.7,
              }} />
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ── How it works sidebar ─────────────────────────────────────────────────
  const HowItWorks = () => (
    <div style={{
      width: 300, flexShrink: 0,
      display: 'flex', flexDirection: 'column', gap: '0.75rem',
    }}>
      <div style={{
        background: 'var(--bg-secondary)', borderRadius: 12,
        border: '1px solid var(--border-color, rgba(0,0,0,0.08))',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)',
      }}>
        {/* Header */}
        <div style={{
          padding: '0.875rem 1rem',
          borderBottom: '1px solid var(--border-color, rgba(0,0,0,0.08))',
          background: 'linear-gradient(135deg, rgba(220,56,45,0.06) 0%, rgba(59,130,246,0.06) 100%)',
        }}>
          <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
            How does GPT-4o pick tools?
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary, #6b7280)' }}>
            The agentic loop, explained
          </div>
        </div>

        <div style={{ padding: '0.875rem 1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Step 1 */}
          <Step
            num="1"
            color="#dc382d"
            title="Tools described in plain English"
            body={<>Each MCP tool is sent to GPT-4o as a <Code>name</Code>, a <Code>description</Code>, and a JSON parameter schema — like API documentation. Redis auto-generates these from your entity schema.</>}
            snippet={`{
  "name": "search_product_by_text",
  "description": "keyword search on
    name and description",
  "parameters": {
    "query": { "type": "string" }
  }
}`}
          />

          {/* Step 2 */}
          <Step
            num="2"
            color="#7c3aed"
            title="GPT-4o reads & decides"
            body={<>GPT-4o matches your message to the best tool by reading the descriptions — the same way a developer reads API docs. The system prompt provides extra hints (e.g. <Code>&quot;under $100&quot; → price in cents</Code>).</>}
            snippet={`// finish_reason: "tool_calls"
{
  "name": "search_product_by_text",
  "arguments": {
    "query": "noise-cancelling"
  }
}`}
          />

          {/* Step 3 */}
          <Step
            num="3"
            color="#059669"
            title="Your server runs the tool"
            body={<>GPT-4o never touches Redis directly — it only outputs <em>which tool</em> and <em>what args</em>. Your Next.js API route calls the Redis MCP endpoint, then appends the result back into the conversation.</>}
            snippet={`// route.ts agentic loop
while (true) {
  const res = await openai.chat...
  if (res.finish_reason !==
      "tool_calls") break; // done
  const result = await callMcp(...)
  messages.push(result) // feed back
}`}
          />

          {/* Step 4 */}
          <Step
            num="4"
            color="#d97706"
            title="Loop until no more tools"
            body={<>GPT-4o can call multiple tools across multiple rounds. Each round it sees all previous tool results and decides whether to call another tool or write the final answer.</>}
            isLast
          >
            <div style={{
              marginTop: '0.5rem',
              display: 'flex', flexDirection: 'column', gap: '0.3rem',
            }}>
              {[
                { phase: 'llm', label: 'GPT-4o plans', color: '#dc382d' },
                { phase: 'tool', label: 'MCP tool runs', color: '#3b82f6' },
                { phase: 'llm', label: 'GPT-4o re-evaluates', color: '#dc382d' },
                { phase: 'done', label: 'Final answer', color: '#059669' },
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                    background: row.color,
                  }} />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary, #6b7280)' }}>
                    {row.label}
                  </span>
                  {i < 3 && (
                    <svg style={{ marginLeft: 'auto', flexShrink: 0 }} width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M12 5v14M5 12l7 7 7-7" />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </Step>
        </div>
      </div>

      {/* Tools legend */}
      <div style={{
        background: 'var(--bg-secondary)', borderRadius: 12, padding: '0.875rem 1rem',
        border: '1px solid var(--border-color, rgba(0,0,0,0.08))',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.6rem' }}>
          Available MCP Tools
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          {[
            ['filter_product_by_category', 'Browse by department'],
            ['find_product_by_price_range', 'Filter by budget'],
            ['find_product_by_rating_range', 'Find top-rated items'],
            ['find_product_by_stock_range', 'Check availability'],
            ['search_product_by_text', 'Keyword search'],
            ['get_product_by_id', 'Full product details'],
          ].map(([name, desc]) => (
            <div key={name} style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <span style={{ fontSize: '0.675rem', fontFamily: 'monospace', color: '#2563eb', fontWeight: 600 }}>
                {name}
              </span>
              <span style={{ fontSize: '0.675rem', color: 'var(--text-secondary, #6b7280)' }}>{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="container" style={{ maxWidth: 1280, paddingTop: '2rem', paddingBottom: '2rem' }}>

      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href="/" style={{ color: 'var(--accent-color)', textDecoration: 'none', fontSize: '0.875rem' }}>
          ← Back to Home
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.75rem' }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: 'linear-gradient(135deg, #dc382d 0%, #c02f25 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--accent-color)' }}>ShopBot</h1>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary, #6b7280)' }}>
              Powered by Redis Cloud Context Retriever + LangGraph
            </p>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {['Electronics', 'Clothing', 'Books', 'Sports', 'Furniture'].map((cat) => (
              <span key={cat} style={{
                padding: '0.25rem 0.6rem', borderRadius: 20, fontSize: '0.75rem',
                background: 'rgba(220,56,45,0.1)', color: 'var(--accent-color)',
                border: '1px solid rgba(220,56,45,0.3)',
              }}>{cat}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Two-column layout: chat + sidebar */}
      <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>

      {/* Chat window */}
      <div style={{ flex: 1, minWidth: 0 }}>
      <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '65vh' }}>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '80%',
                padding: '0.75rem 1rem',
                borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: msg.role === 'user'
                  ? 'linear-gradient(135deg, #dc382d 0%, #c02f25 100%)'
                  : 'var(--bg-primary)',
                color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
                boxShadow: 'var(--shadow-sm)',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.6,
                fontSize: '0.9375rem',
              }}>
                {msg.content}
              </div>

              {/* Tool calls */}
              {msg.toolCalls && msg.toolCalls.length > 0 && (
                <div style={{ maxWidth: '80%', marginTop: '0.4rem' }}>
                  <button
                    onClick={() => toggleTools(`${i}`)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem 0',
                      fontSize: '0.75rem', color: 'var(--text-secondary, #6b7280)',
                      display: 'flex', alignItems: 'center', gap: '0.3rem',
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                    </svg>
                    {expandedTools.has(`${i}`) ? 'Hide' : 'Show'} {msg.toolCalls.length} tool call{msg.toolCalls.length > 1 ? 's' : ''}
                  </button>
                  {expandedTools.has(`${i}`) && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
                      {msg.toolCalls.map((tc, j) => (
                        <div key={j} style={{
                          background: 'var(--bg-primary)', borderRadius: 8, padding: '0.6rem 0.75rem',
                          border: '1px solid rgba(59,130,246,0.2)', fontSize: '0.75rem', fontFamily: 'monospace',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: 4 }}>
                            <div style={{
                              width: 16, height: 16, borderRadius: 4,
                              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            }}>
                              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                              </svg>
                            </div>
                            <span style={{ color: '#2563eb', fontWeight: 600 }}>{formatToolName(tc.tool)}</span>
                          </div>
                          <div style={{ color: 'var(--text-secondary, #6b7280)' }}>
                            {JSON.stringify(tc.args)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Live phase indicator */}
          {loading && <PhaseIndicator />}

          <div ref={bottomRef} />
        </div>

        {/* Suggested prompts */}
        {messages.length <= 1 && (
          <div style={{
            padding: '0 1.5rem 0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap',
          }}>
            {SUGGESTED.map((s) => (
              <button key={s} onClick={() => sendMessage(s)} style={{
                padding: '0.4rem 0.75rem', borderRadius: 20, fontSize: '0.8rem',
                background: 'var(--bg-primary)', border: '1px solid rgba(220,56,45,0.3)',
                color: 'var(--text-primary)', cursor: 'pointer',
              }}>
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input bar */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid var(--border-color, rgba(0,0,0,0.1))',
          display: 'flex', gap: '0.75rem', alignItems: 'flex-end',
          background: 'var(--bg-secondary)',
        }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Ask about products… (Enter to send)"
            rows={1}
            style={{
              flex: 1, resize: 'none', padding: '0.625rem 0.875rem',
              borderRadius: 10, border: '2px solid var(--input-border, #e5e7eb)',
              background: 'var(--input-bg, var(--bg-primary))', color: 'var(--text-primary)',
              fontSize: '0.9375rem', lineHeight: 1.5, outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => (e.target.style.borderColor = '#dc382d')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--input-border, #e5e7eb)')}
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            style={{
              padding: '0.625rem 1.25rem', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: loading || !input.trim()
                ? 'var(--bg-primary)'
                : 'linear-gradient(135deg, #dc382d 0%, #c02f25 100%)',
              color: loading || !input.trim() ? 'var(--text-secondary, #6b7280)' : 'white',
              fontWeight: 600, fontSize: '0.9375rem', transition: 'all 0.2s',
              flexShrink: 0,
            }}
          >
            Send
          </button>
        </div>
      </div>

      </div>{/* end chat column */}

      {/* Sidebar */}
      <HowItWorks />

      </div>{/* end two-column row */}

      {/* Footer info */}
      <div style={{
        marginTop: '1rem', padding: '0.875rem 1.25rem',
        background: 'var(--bg-secondary)', borderRadius: 10,
        display: 'flex', gap: '1.5rem', flexWrap: 'wrap',
        fontSize: '0.8125rem', color: 'var(--text-secondary, #6b7280)',
        boxShadow: 'var(--shadow-sm)',
      }}>
        {[
          ['🗄️', 'Redis Cloud', 'Context Retriever'],
          ['🔧', '6 MCP tools', 'auto-generated'],
          ['🤖', 'GPT-4o', 'LangGraph agent'],
          ['📦', '20 products', '5 categories'],
        ].map(([icon, label, sub]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>{icon}</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{label}</span>
            <span>· {sub}</span>
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
        @keyframes phasePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.75; }
        }
      `}</style>
    </div>
  );
}
