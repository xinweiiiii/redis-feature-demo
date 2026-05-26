"""
Context Retriever Surface Setup

Creates a Redis Cloud Context Retriever surface for the e-commerce product catalog
and loads product records via the Context Surfaces API.

HOW TO CREATE THE SURFACE (one-time, via Redis Cloud console):
  1. Go to https://cloud.redis.io → Context Retriever → New service
  2. Select your Redis Cloud database
  3. Click "Auto-detect fields" under the Product entity, or define manually:
       Entity name : Product
       Key Template: product:{id}
       Fields       : name (text), description (text), category (tag),
                      price (numeric), stock (numeric), rating (numeric)
  4. Click Create
  5. Go to Context Retriever → Admin keys → New admin key → copy to CTX_ADMIN_KEY in .env
  6. Run this script — it will find your surface, create an agent key, and load data

Alternatively, create via ctxctl CLI after installing context-surfaces:
  ctxctl surface create --name ecommerce-shopbot --database <db-id>

Usage:
  python3 ecommerce/setup_surface.py
"""

import asyncio
import json
import os
import re
import sys
from pathlib import Path

# Allow running as `python3 ecommerce/setup_surface.py` from the project root
sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv

ENV_PATH = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=ENV_PATH)

from context_surfaces import ContextModel, UnifiedClient
from context_surfaces.models import (
    CreateContextSurfaceRequest,
    DataSourceConnectionConfig,
    DataSourceRequest,
)

from ecommerce.schema import DATA_MODEL, Product

# ---------------------------------------------------------------------------
# Product catalog
# ---------------------------------------------------------------------------
def _p(dollars: float) -> int:
    """Convert dollar float to integer cents (e.g. 349.99 → 34999)."""
    return round(dollars * 100)

def _r(stars: float) -> int:
    """Convert star rating to ×10 integer (e.g. 4.8 → 48)."""
    return round(stars * 10)

PRODUCTS: list[Product] = [
    # Electronics
    Product(id="e001", name="Sony WH-1000XM5 Wireless Headphones",
            description="Industry-leading noise cancellation with 30-hour battery life. Perfect for travel and focus work.",
            category="Electronics", price=_p(349.99), stock=45, rating=_r(4.8)),
    Product(id="e002", name="Apple AirPods Pro (2nd Gen)",
            description="Active noise cancellation, transparency mode, and spatial audio for immersive sound experience.",
            category="Electronics", price=_p(249.00), stock=120, rating=_r(4.7)),
    Product(id="e003", name='Samsung 65" QLED 4K Smart TV',
            description="Quantum dot display with 4K resolution, HDR support, and built-in streaming apps.",
            category="Electronics", price=_p(1199.99), stock=18, rating=_r(4.6)),
    Product(id="e004", name="Logitech MX Master 3S Mouse",
            description="Ultra-quiet clicks, 8K DPI precision, and ergonomic design for all-day productivity.",
            category="Electronics", price=_p(99.99), stock=200, rating=_r(4.9)),
    Product(id="e005", name="iPad Air 11-inch (M2)",
            description="Powerful M2 chip, stunning Liquid Retina display, and all-day battery for work and creativity.",
            category="Electronics", price=_p(599.00), stock=60, rating=_r(4.8)),
    # Clothing
    Product(id="c001", name="Levi's 501 Original Jeans",
            description="Classic straight fit denim jeans with button fly. Timeless style for casual everyday wear.",
            category="Clothing", price=_p(69.50), stock=300, rating=_r(4.5)),
    Product(id="c002", name="Nike Air Force 1 '07 Sneakers",
            description="Iconic low-top basketball-inspired sneakers with cushioned sole and clean white leather upper.",
            category="Clothing", price=_p(110.00), stock=250, rating=_r(4.7)),
    Product(id="c003", name="Patagonia Better Sweater Fleece",
            description="Warm recycled fleece jacket with zip-up collar. Ideal for outdoor activities and layering.",
            category="Clothing", price=_p(139.00), stock=80, rating=_r(4.8)),
    Product(id="c004", name="Uniqlo HEATTECH Thermal Shirt",
            description="Ultra-thin moisture-wicking base layer that generates and retains body heat for cold weather.",
            category="Clothing", price=_p(29.90), stock=500, rating=_r(4.6)),
    Product(id="c005", name="Adidas Ultraboost 22 Running Shoes",
            description="Responsive Boost midsole with Primeknit upper for a sock-like fit during long runs.",
            category="Clothing", price=_p(180.00), stock=90, rating=_r(4.7)),
    # Furniture
    Product(id="f001", name="Herman Miller Aeron Chair",
            description="Ergonomic office chair with lumbar support, adjustable armrests, and breathable mesh back.",
            category="Furniture", price=_p(1395.00), stock=12, rating=_r(4.9)),
    Product(id="f002", name="IKEA KALLAX Shelf Unit",
            description="Versatile shelving unit for storage and display. Compatible with a range of inserts.",
            category="Furniture", price=_p(69.99), stock=150, rating=_r(4.4)),
    Product(id="f003", name="West Elm Mid-Century Dining Table",
            description="Solid wood dining table with tapered legs in a mid-century modern style. Seats up to 6.",
            category="Furniture", price=_p(799.00), stock=8, rating=_r(4.6)),
    Product(id="f004", name="Casper Original Foam Mattress (Queen)",
            description="Pressure-relieving memory foam layers for all sleep positions with a 100-night trial.",
            category="Furniture", price=_p(1095.00), stock=25, rating=_r(4.5)),
    # Books
    Product(id="b001", name="Designing Data-Intensive Applications",
            description="In-depth guide to the principles behind reliable, scalable, and maintainable distributed systems.",
            category="Books", price=_p(45.99), stock=400, rating=_r(4.9)),
    Product(id="b002", name="Atomic Habits",
            description="Practical guide to building good habits and breaking bad ones using proven behavioral psychology.",
            category="Books", price=_p(18.99), stock=600, rating=_r(4.8)),
    Product(id="b003", name="The Pragmatic Programmer",
            description="Classic software engineering book covering best practices, tips, and mindsets for modern developers.",
            category="Books", price=_p(49.95), stock=350, rating=_r(4.7)),
    # Sports
    Product(id="s001", name="Peloton Bike+",
            description='Connected exercise bike with rotating 23.8" HD touchscreen and auto-follow resistance for live classes.',
            category="Sports", price=_p(2495.00), stock=5, rating=_r(4.6)),
    Product(id="s002", name="Hydro Flask 32oz Water Bottle",
            description="Insulated stainless steel bottle that keeps drinks cold 24hrs and hot 12hrs. BPA-free.",
            category="Sports", price=_p(49.95), stock=700, rating=_r(4.8)),
    Product(id="s003", name="Manduka PRO Yoga Mat",
            description="Professional-grade 6mm thick mat with non-slip surface and lifetime guarantee. Ideal for hot yoga.",
            category="Sports", price=_p(120.00), stock=180, rating=_r(4.7)),
]


# ---------------------------------------------------------------------------
# .env helpers
# ---------------------------------------------------------------------------

def _read_env(key: str) -> str:
    return os.environ.get(key, "")


def _write_env_var(key: str, value: str) -> None:
    content = ENV_PATH.read_text() if ENV_PATH.exists() else ""
    pattern = re.compile(rf"^{re.escape(key)}=.*$", re.MULTILINE)
    new_line = f"{key}={value}"
    if pattern.search(content):
        content = pattern.sub(new_line, content)
    else:
        content = content.rstrip("\n") + f"\n{new_line}\n"
    ENV_PATH.write_text(content)
    os.environ[key] = value
    print(f"  .env updated: {key}=<hidden>")


def _delete_env_var(key: str) -> None:
    content = ENV_PATH.read_text() if ENV_PATH.exists() else ""
    pattern = re.compile(rf"^{re.escape(key)}=.*\n?", re.MULTILINE)
    ENV_PATH.write_text(pattern.sub("", content))
    os.environ.pop(key, None)


# ---------------------------------------------------------------------------
# Surface management
# ---------------------------------------------------------------------------

async def _get_surface_status(client: UnifiedClient, surface_id: str, admin_key: str) -> dict:
    return await client._api_client._request(
        "GET", f"/api/v1/context-surfaces/{surface_id}", api_key=admin_key
    )


async def _delete_surface(client: UnifiedClient, surface_id: str, admin_key: str) -> None:
    await client._api_client._request(
        "DELETE", f"/api/v1/context-surfaces/{surface_id}", api_key=admin_key
    )


async def _find_existing_surface(client: UnifiedClient, admin_key: str, name: str) -> dict | None:
    """Return the first surface with the given name, or None."""
    data = await client._api_client._request(
        "GET", "/api/v1/context-surfaces", api_key=admin_key
    )
    for s in data.get("context_surfaces", []):
        if s.get("name") == name:
            return s
    return None


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

async def main() -> None:
    admin_key = _read_env("CTX_ADMIN_KEY")
    if not admin_key:
        print("ERROR: CTX_ADMIN_KEY is not set.")
        print()
        print("To get your admin key:")
        print("  1. Open https://cloud.redis.io → Context Retriever → Admin keys")
        print("  2. Click 'New admin key', copy the value")
        print("  3. Add  CTX_ADMIN_KEY=<value>  to your .env file")
        return

    surface_id = _read_env("CTX_SURFACE_ID")
    agent_key  = _read_env("MCP_AGENT_KEY")

    async with UnifiedClient() as client:

        # ── Step 1: resolve the surface ──────────────────────────────────────
        if surface_id:
            print(f"Checking existing surface: {surface_id}")
            details = await _get_surface_status(client, surface_id, admin_key)
            status  = details.get("status", "unknown")
            reason  = details.get("status_reason", "")
            print(f"  Status: {status}" + (f" ({reason})" if reason else ""))

            if status == "indices_failed":
                print()
                print("  Surface provisioning failed — the Context Retriever service could")
                print("  not connect to your Redis database to create search indexes.")
                print()
                print("  This usually means the surface was created via API with an external")
                print("  Redis URL instead of being linked to a Redis Cloud database.")
                print()
                print("  RESOLUTION — create the surface via Redis Cloud console:")
                print("    1. Go to https://cloud.redis.io → Context Retriever → New service")
                print("    2. Select your Redis Cloud database (internal networking)")
                print("    3. Entity: Product | Key template: product:{id}")
                print("    4. Auto-detect or add fields: name, description, category, price, stock, rating")
                print("    5. Create the service")
                print()
                print(f"  Deleting failed surface {surface_id}…")
                try:
                    await _delete_surface(client, surface_id, admin_key)
                    _delete_env_var("CTX_SURFACE_ID")
                    _delete_env_var("MCP_AGENT_KEY")
                    print("  Deleted. Re-run this script after creating the surface via the UI.")
                except Exception as exc:
                    print(f"  Could not delete: {exc}")
                return

            if status not in ("ready", "active"):
                print(f"  Surface not ready (status={status}). Try again in a few seconds.")
                return

            print("  Surface is ready.")
        else:
            # Try to find by name first (avoid duplicates)
            print("Looking for existing 'ecommerce-shopbot' surface…")
            existing = await _find_existing_surface(client, admin_key, "ecommerce-shopbot")
            if existing:
                surface_id = existing["id"]
                status     = existing.get("status", "unknown")
                print(f"  Found: {surface_id}  status={status}")
                if status == "indices_failed":
                    print("  Surface has failed indexes. Please delete it and create via console.")
                    print("  See the docstring at the top of this file for instructions.")
                    return
                _write_env_var("CTX_SURFACE_ID", surface_id)
            else:
                print("No surface found. Please create one via the Redis Cloud console.")
                print("See the docstring at the top of this file for step-by-step instructions.")
                return

        # ── Step 2: create agent key if missing ──────────────────────────────
        if not agent_key:
            print("Creating MCP agent key…")
            agent_key_obj = await client.create_agent_key(
                admin_key=admin_key,
                surface_id=surface_id,
                name="shopbot-agent",
                description="ShopBot LangGraph agent",
            )
            agent_key = agent_key_obj.key
            _write_env_var("MCP_AGENT_KEY", agent_key)

        # ── Step 3: load product data as Redis JSON ───────────────────────────
        # The Context Retriever reads Redis JSON keys (JSON.SET), not Hashes.
        # We write directly to Redis so the service can query the data.
        print(f"\nWriting {len(PRODUCTS)} products to Redis as JSON…")
        import redis as _redis
        r = _redis.Redis(
            host=os.environ["REDIS_HOST"],
            port=int(os.environ["REDIS_PORT"]),
            password=os.environ.get("REDIS_PASSWORD", ""),
            decode_responses=True,
        )
        for p in PRODUCTS:
            key = f"product:{p.id}"
            r.delete(key)  # remove old Hash key if it exists
            r.execute_command("JSON.SET", key, "$", json.dumps(p.model_dump()))
        r.close()
        print(f"  Written {len(PRODUCTS)} JSON keys (product:*)")

        # ── Step 4: list auto-generated tools ────────────────────────────────
        print("\nAuto-generated MCP tools:")
        details = await _get_surface_status(client, surface_id, admin_key)
        for tool_name in details.get("tools", []):
            print(f"  • {tool_name}")

    print("\nSetup complete. Run the chatbot with:")
    print("  python3 ecommerce/chatbot.py")


if __name__ == "__main__":
    asyncio.run(main())
