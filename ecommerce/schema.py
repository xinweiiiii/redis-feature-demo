"""
E-Commerce Entity Schema for Redis Cloud Context Retriever

Defines the Product entity using context_surfaces ContextModel + ContextField.
The Context Retriever service reads this schema to:
  - Create Redis Search indexes for each indexed field
  - Auto-generate MCP retrieval tools (filter_*, find_*_range, search_*, get_*)
  - Expose those tools to the LangGraph agent

Run `python setup_surface.py` to register this schema and load product data.
"""

from context_surfaces import ContextField, ContextModel, ContextRelationship, export_data_model


class Product(ContextModel):
    """An item in the e-commerce product catalog."""

    __redis_key_template__ = "product:{id}"

    id: str = ContextField(
        description="Unique product identifier (e.g. e001, c002)",
        is_key_component=True,
    )
    name: str = ContextField(
        description="Full product name",
        index="text",
        weight=2.0,
    )
    description: str = ContextField(
        description="Product description and key features",
        index="text",
    )
    category: str = ContextField(
        description="Department: Electronics | Clothing | Furniture | Books | Sports",
        index="tag",
    )
    price: int = ContextField(
        description="Price in USD cents (e.g. 34999 = $349.99). Divide by 100 to display.",
        index="numeric",
        sortable=True,
    )
    stock: int = ContextField(
        description="Units available in inventory",
        index="numeric",
        sortable=True,
    )
    rating: int = ContextField(
        description="Customer rating ×10 (e.g. 48 = 4.8 stars). Divide by 10 to display.",
        index="numeric",
        sortable=True,
    )


# The data model dict that setup_surface.py sends to the Context Retriever API
DATA_MODEL = export_data_model(
    title="E-Commerce Product Catalog",
    description="Retail product catalog with pricing, stock, and category data for an e-commerce assistant.",
    entities=[Product],
)
