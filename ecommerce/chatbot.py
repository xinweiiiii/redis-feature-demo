"""
E-Commerce Chatbot — LangGraph + Redis Cloud Context Retriever

Architecture:
  User ──► LangGraph ReAct Agent ──► UnifiedClient ──► Redis Cloud Context Retriever
                  │                                              │
            ChatOpenAI (gpt-4o)              auto-generated MCP tools
                                          (filter_product_by_category,
                                           find_product_by_price_range,
                                           search_product_by_text, …)

The Context Retriever service (on Redis Cloud) auto-generates retrieval tools
from the entity schema defined in schema.py. The agent calls those tools
via UnifiedClient — no hand-written search queries needed.

Prerequisites:
  - Run `python ecommerce/setup_surface.py` once to create the surface
  - CTX_SURFACE_ID and MCP_AGENT_KEY must be in .env

Usage:
  python ecommerce/chatbot.py
"""

import asyncio
import json
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).parent.parent / ".env")

try:
    from context_surfaces import UnifiedClient
    from langchain_core.messages import AIMessage, HumanMessage
    from langchain_core.tools import StructuredTool
    from langchain_openai import ChatOpenAI
    from langgraph.prebuilt import create_react_agent
except ImportError as exc:
    print(f"Missing dependency: {exc}")
    print("Install with:  pip install -r ecommerce/requirements.txt")
    sys.exit(1)

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
CHAT_MODEL     = os.environ.get("CHAT_MODEL", "gpt-4o")
MCP_AGENT_KEY  = os.environ.get("MCP_AGENT_KEY", "")

SYSTEM_PROMPT = """You are ShopBot, a friendly and knowledgeable e-commerce assistant.

You have live access to the product catalog through auto-generated retrieval tools
powered by Redis Cloud Context Retriever. Use them to answer every product question.

IMPORTANT — field encoding in the catalog:
- price  : stored in cents → divide by 100 to display in dollars
  (e.g. price=34999 means $349.99)
- rating : stored ×10 → divide by 10 to display stars
  (e.g. rating=48 means ★ 4.8)
- When filtering by price range, convert the user's dollar amount to cents first
  (e.g. "under $100" → max_value=10000)
- When filtering by rating range, convert to ×10 first
  (e.g. "above 4.5 stars" → min_value=45)

Tool usage guide:
- filter_product_by_category   → browse a department (Electronics, Clothing, Furniture, Books, Sports)
- find_product_by_price_range  → filter by budget (values in cents)
- find_product_by_stock_range  → check availability
- find_product_by_rating_range → find top-rated items (values ×10)
- search_product_by_text       → keyword search on name and description
- get_product_by_id            → fetch one product's full details

Response style:
- Format product listings as a numbered list.
- Always display price as $X.XX (divide price_cents by 100).
- Always display rating as ★ X.X (divide rating_x10 by 10).
- Mention low stock (< 10 units) to help the user decide quickly.
- If nothing matches, suggest the closest alternative category.
"""


# ---------------------------------------------------------------------------
# Build LangGraph agent from Context Retriever tools
# ---------------------------------------------------------------------------

def _make_args_schema(tool_def: dict) -> type:
    """Convert a JSON Schema inputSchema → Pydantic model for StructuredTool."""
    from pydantic import create_model
    from pydantic.fields import FieldInfo

    input_schema = tool_def.get("inputSchema", {})
    properties   = input_schema.get("properties", {})
    required     = set(input_schema.get("required", []))

    fields: dict = {}
    for prop_name, prop_schema in properties.items():
        json_type  = prop_schema.get("type", "string")
        field_desc = prop_schema.get("description", "")
        python_type: type
        if json_type == "number":
            python_type = float
        elif json_type == "integer":
            python_type = int
        elif json_type == "boolean":
            python_type = bool
        else:
            python_type = str

        if prop_name in required:
            fields[prop_name] = (python_type, FieldInfo(description=field_desc))
        else:
            fields[prop_name] = (python_type | None, FieldInfo(default=None, description=field_desc))

    model_name = "".join(w.capitalize() for w in tool_def["name"].split("_")) + "Args"
    return create_model(model_name, **fields)


def build_langchain_tools(
    raw_tools: list[dict],
    agent_key: str,
    client: UnifiedClient,
) -> list[StructuredTool]:
    """Wrap each Context Retriever MCP tool as a LangChain StructuredTool."""
    lc_tools = []
    for tool_def in raw_tools:
        name        = tool_def["name"]
        description = tool_def.get("description", name)
        args_schema = _make_args_schema(tool_def)

        # Capture loop variable
        def make_func(tool_name: str):
            async def _call_tool(**kwargs) -> str:
                clean_args = {k: v for k, v in kwargs.items() if v is not None}
                result = await client.query_tool(
                    agent_key=agent_key,
                    tool_name=tool_name,
                    arguments=clean_args,
                )
                # Normalise: Context Retriever returns dicts or MCP content objects
                if isinstance(result, dict):
                    content = result.get("content", [])
                    if content and isinstance(content, list):
                        return content[0].get("text", json.dumps(result))
                    return json.dumps(result)
                return str(result)
            return _call_tool

        lc_tools.append(
            StructuredTool.from_function(
                coroutine=make_func(name),
                name=name,
                description=description,
                args_schema=args_schema,
            )
        )
    return lc_tools


async def create_agent():
    """Connect to Redis Cloud Context Retriever and build a LangGraph ReAct agent."""
    if not MCP_AGENT_KEY:
        print("ERROR: MCP_AGENT_KEY not set. Run `python ecommerce/setup_surface.py` first.")
        sys.exit(1)

    client = UnifiedClient()
    await client.__aenter__()

    print("Fetching auto-generated tools from Redis Cloud Context Retriever…")
    raw_tools = await client.list_tools(MCP_AGENT_KEY)
    lc_tools  = build_langchain_tools(raw_tools, MCP_AGENT_KEY, client)

    print(f"  {len(lc_tools)} tools loaded:")
    for t in lc_tools:
        print(f"    • {t.name}")

    llm = ChatOpenAI(
        model=CHAT_MODEL,
        api_key=OPENAI_API_KEY,
        temperature=0.3,
    )

    agent = create_react_agent(llm, lc_tools, prompt=SYSTEM_PROMPT)
    return agent, client


# ---------------------------------------------------------------------------
# Interactive chat loop
# ---------------------------------------------------------------------------

def _print_banner() -> None:
    print()
    print("=" * 62)
    print("  ShopBot — Redis Cloud Context Retriever + LangGraph")
    print("=" * 62)
    print("  Type a question and press Enter.")
    print("  Commands: 'quit'/'exit' to leave  |  'clear' to reset chat")
    print("=" * 62)
    print()


async def chat_loop(agent, client) -> None:
    _print_banner()
    messages: list = []

    try:
        while True:
            try:
                user_input = input("You: ").strip()
            except (EOFError, KeyboardInterrupt):
                print("\nGoodbye!")
                break

            if not user_input:
                continue
            if user_input.lower() in {"quit", "exit"}:
                print("Goodbye!")
                break
            if user_input.lower() == "clear":
                messages = []
                print("[Chat history cleared]\n")
                continue

            messages.append(HumanMessage(content=user_input))
            print("\nShopBot: ", end="", flush=True)

            try:
                result = await agent.ainvoke({"messages": messages})
                reply  = result["messages"][-1]
                print(reply.content)
                messages.append(AIMessage(content=reply.content))
            except Exception as exc:
                print(f"[Error] {exc}")
                messages.pop()

            print()
    finally:
        await client.__aexit__(None, None, None)


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

async def main() -> None:
    print("Starting ShopBot…")
    print(f"  LLM     : {CHAT_MODEL}")
    print(f"  Backend : Redis Cloud Context Retriever")

    agent, client = await create_agent()
    await chat_loop(agent, client)


if __name__ == "__main__":
    asyncio.run(main())
