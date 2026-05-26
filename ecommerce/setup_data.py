"""
E-Commerce Data Setup Script

Loads a product catalog into Redis with:
- Product metadata stored as Redis Hashes
- Vector embeddings for semantic similarity search
- A RediSearch index for hybrid search (vector + filters)

Run this once before starting the chatbot.
"""

import os
import json
import numpy as np
import redis
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "../.env"))

REDIS_HOST = os.environ["REDIS_HOST"]
REDIS_PORT = int(os.environ["REDIS_PORT"])
REDIS_PASSWORD = os.environ["REDIS_PASSWORD"]
INDEX_NAME = "idx:ecommerce"
KEY_PREFIX = "product:"
VECTOR_DIM = 384  # all-MiniLM-L6-v2 output dimension

# ---------------------------------------------------------------------------
# Product catalog
# ---------------------------------------------------------------------------
PRODUCTS = [
    # Electronics
    {
        "id": "e001",
        "name": "Sony WH-1000XM5 Wireless Headphones",
        "description": "Industry-leading noise cancellation with 30-hour battery life. Perfect for travel and focus work.",
        "category": "Electronics",
        "price": 349.99,
        "stock": 45,
        "rating": 4.8,
    },
    {
        "id": "e002",
        "name": "Apple AirPods Pro (2nd Gen)",
        "description": "Active noise cancellation, transparency mode, and spatial audio for immersive sound experience.",
        "category": "Electronics",
        "price": 249.00,
        "stock": 120,
        "rating": 4.7,
    },
    {
        "id": "e003",
        "name": "Samsung 65\" QLED 4K Smart TV",
        "description": "Quantum dot display with 4K resolution, HDR support, and built-in streaming apps.",
        "category": "Electronics",
        "price": 1199.99,
        "stock": 18,
        "rating": 4.6,
    },
    {
        "id": "e004",
        "name": "Logitech MX Master 3S Mouse",
        "description": "Ultra-quiet clicks, 8K DPI precision, and ergonomic design for all-day productivity.",
        "category": "Electronics",
        "price": 99.99,
        "stock": 200,
        "rating": 4.9,
    },
    {
        "id": "e005",
        "name": "iPad Air 11-inch (M2)",
        "description": "Powerful M2 chip, stunning Liquid Retina display, and all-day battery for work and creativity.",
        "category": "Electronics",
        "price": 599.00,
        "stock": 60,
        "rating": 4.8,
    },
    # Clothing
    {
        "id": "c001",
        "name": "Levi's 501 Original Jeans",
        "description": "Classic straight fit denim jeans with button fly. Timeless style for casual everyday wear.",
        "category": "Clothing",
        "price": 69.50,
        "stock": 300,
        "rating": 4.5,
    },
    {
        "id": "c002",
        "name": "Nike Air Force 1 '07 Sneakers",
        "description": "Iconic low-top basketball-inspired sneakers with cushioned sole and clean white leather upper.",
        "category": "Clothing",
        "price": 110.00,
        "stock": 250,
        "rating": 4.7,
    },
    {
        "id": "c003",
        "name": "Patagonia Better Sweater Fleece",
        "description": "Warm recycled fleece jacket with zip-up collar. Ideal for outdoor activities and layering.",
        "category": "Clothing",
        "price": 139.00,
        "stock": 80,
        "rating": 4.8,
    },
    {
        "id": "c004",
        "name": "Uniqlo HEATTECH Thermal Shirt",
        "description": "Ultra-thin moisture-wicking base layer that generates and retains body heat for cold weather.",
        "category": "Clothing",
        "price": 29.90,
        "stock": 500,
        "rating": 4.6,
    },
    {
        "id": "c005",
        "name": "Adidas Ultraboost 22 Running Shoes",
        "description": "Responsive Boost midsole with Primeknit upper for a sock-like fit during long runs.",
        "category": "Clothing",
        "price": 180.00,
        "stock": 90,
        "rating": 4.7,
    },
    # Furniture
    {
        "id": "f001",
        "name": "Herman Miller Aeron Chair",
        "description": "Ergonomic office chair with lumbar support, adjustable armrests, and breathable mesh back.",
        "category": "Furniture",
        "price": 1395.00,
        "stock": 12,
        "rating": 4.9,
    },
    {
        "id": "f002",
        "name": "IKEA KALLAX Shelf Unit",
        "description": "Versatile shelving unit for storage and display. Compatible with a range of inserts and accessories.",
        "category": "Furniture",
        "price": 69.99,
        "stock": 150,
        "rating": 4.4,
    },
    {
        "id": "f003",
        "name": "West Elm Mid-Century Dining Table",
        "description": "Solid wood dining table with tapered legs in a mid-century modern style. Seats up to 6.",
        "category": "Furniture",
        "price": 799.00,
        "stock": 8,
        "rating": 4.6,
    },
    {
        "id": "f004",
        "name": "Casper Original Foam Mattress (Queen)",
        "description": "Pressure-relieving memory foam layers for all sleep positions with a 100-night trial.",
        "category": "Furniture",
        "price": 1095.00,
        "stock": 25,
        "rating": 4.5,
    },
    # Books
    {
        "id": "b001",
        "name": "Designing Data-Intensive Applications",
        "description": "In-depth guide to the principles behind reliable, scalable, and maintainable distributed systems.",
        "category": "Books",
        "price": 45.99,
        "stock": 400,
        "rating": 4.9,
    },
    {
        "id": "b002",
        "name": "Atomic Habits",
        "description": "Practical guide to building good habits and breaking bad ones using proven behavioral psychology.",
        "category": "Books",
        "price": 18.99,
        "stock": 600,
        "rating": 4.8,
    },
    {
        "id": "b003",
        "name": "The Pragmatic Programmer",
        "description": "Classic software engineering book covering best practices, tips, and mindsets for modern developers.",
        "category": "Books",
        "price": 49.95,
        "stock": 350,
        "rating": 4.7,
    },
    # Sports
    {
        "id": "s001",
        "name": "Peloton Bike+",
        "description": "Connected exercise bike with rotating 23.8\" HD touchscreen and auto-follow resistance for live classes.",
        "category": "Sports",
        "price": 2495.00,
        "stock": 5,
        "rating": 4.6,
    },
    {
        "id": "s002",
        "name": "Hydro Flask 32oz Water Bottle",
        "description": "Insulated stainless steel bottle that keeps drinks cold 24hrs and hot 12hrs. BPA-free.",
        "category": "Sports",
        "price": 49.95,
        "stock": 700,
        "rating": 4.8,
    },
    {
        "id": "s003",
        "name": "Manduka PRO Yoga Mat",
        "description": "Professional-grade 6mm thick mat with non-slip surface and lifetime guarantee. Ideal for hot yoga.",
        "category": "Sports",
        "price": 120.00,
        "stock": 180,
        "rating": 4.7,
    },
]


def create_index(client: redis.Redis) -> None:
    """Create the RediSearch index with vector + filter fields."""
    try:
        client.execute_command("FT.DROPINDEX", INDEX_NAME, "DD")
        print(f"Dropped existing index '{INDEX_NAME}'")
    except Exception:
        pass  # Index didn't exist yet

    client.execute_command(
        "FT.CREATE", INDEX_NAME,
        "ON", "HASH",
        "PREFIX", 1, KEY_PREFIX,
        "SCHEMA",
        "name",        "TEXT",    "WEIGHT", 2.0,
        "description", "TEXT",
        "category",    "TAG",
        "price",       "NUMERIC", "SORTABLE",
        "stock",       "NUMERIC", "SORTABLE",
        "rating",      "NUMERIC", "SORTABLE",
        "vec",         "VECTOR",  "HNSW", 6,
            "TYPE",      "FLOAT32",
            "DIM",       VECTOR_DIM,
            "DISTANCE_METRIC", "COSINE",
    )
    print(f"Created index '{INDEX_NAME}'")


def load_products(
    client: redis.Redis,
    model: SentenceTransformer,
    products: list[dict],
) -> None:
    """Encode each product description and store as a Redis Hash."""
    print(f"Encoding {len(products)} products…")
    pipe = client.pipeline()

    for product in products:
        key = f"{KEY_PREFIX}{product['id']}"
        vec = model.encode(product["description"], normalize_embeddings=True).astype(np.float32)

        pipe.hset(
            key,
            mapping={
                "name":        product["name"],
                "description": product["description"],
                "category":    product["category"],
                "price":       product["price"],
                "stock":       product["stock"],
                "rating":      product["rating"],
                "vec":         vec.tobytes(),
            },
        )

    pipe.execute()
    print(f"Stored {len(products)} products under prefix '{KEY_PREFIX}'")


def main() -> None:
    print("Connecting to Redis…")
    client = redis.Redis(
        host=REDIS_HOST,
        port=REDIS_PORT,
        password=REDIS_PASSWORD,
        decode_responses=False,  # needed for binary vector bytes
    )
    client.ping()
    print("Connected.")

    print("Loading sentence-transformers model…")
    model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

    create_index(client)
    load_products(client, model, PRODUCTS)

    print("\nSetup complete. Product catalog is ready in Redis.")
    print(f"  Index : {INDEX_NAME}")
    print(f"  Keys  : {KEY_PREFIX}*  ({len(PRODUCTS)} products)")
    print(f"  Categories: {sorted(set(p['category'] for p in PRODUCTS))}")


if __name__ == "__main__":
    main()
