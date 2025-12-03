import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';
import { SchemaFieldTypes, VectorAlgorithms } from 'redis';
import { generateOpenAIEmbedding } from '@/lib/embeddings';

// Sample product data
const products = [
  { name: 'Laptop', description: 'High-performance laptop for developers', category: 'Electronics', price: 1299, lat: 37.7749, lon: -122.4194 },
  { name: 'Smartphone', description: 'Latest smartphone with amazing camera', category: 'Electronics', price: 899, lat: 37.7849, lon: -122.4094 },
  { name: 'Headphones', description: 'Noise-cancelling wireless headphones', category: 'Electronics', price: 299, lat: 37.7649, lon: -122.4294 },
  { name: 'Coffee Maker', description: 'Automatic coffee maker with timer', category: 'Home', price: 129, lat: 40.7128, lon: -74.0060 },
  { name: 'Blender', description: 'High-speed blender for smoothies', category: 'Home', price: 89, lat: 40.7228, lon: -74.0160 },
  { name: 'Vacuum Cleaner', description: 'Robot vacuum with smart navigation', category: 'Home', price: 399, lat: 40.7028, lon: -73.9960 },
  { name: 'Running Shoes', description: 'Lightweight running shoes for marathons', category: 'Sports', price: 149, lat: 34.0522, lon: -118.2437 },
  { name: 'Yoga Mat', description: 'Non-slip yoga mat with carrying strap', category: 'Sports', price: 39, lat: 34.0622, lon: -118.2537 },
  { name: 'Weights', description: 'Adjustable Weights set', category: 'Sports', price: 199, lat: 34.0422, lon: -118.2337 },
  { name: 'Office Chair', description: 'Ergonomic office chair with lumbar support', category: 'Furniture', price: 349, lat: 41.8781, lon: -87.6298 },
  { name: 'Standing Desk', description: 'Electric height-adjustable standing desk', category: 'Furniture', price: 599, lat: 41.8881, lon: -87.6398 },
  { name: 'Bookshelf', description: 'Wooden bookshelf with 5 shelves', category: 'Furniture', price: 179, lat: 41.8681, lon: -87.6198 },
];

// Sample locations
const locations = [
  { name: 'San Francisco Store', lat: 37.7749, lon: -122.4194 },
  { name: 'New York Store', lat: 40.7128, lon: -74.0060 },
  { name: 'Los Angeles Store', lat: 34.0522, lon: -118.2437 },
  { name: 'Chicago Store', lat: 41.8781, lon: -87.6298 },
  { name: 'Seattle Store', lat: 47.6062, lon: -122.3321 },
];

export async function POST(_request: NextRequest) {
  try {
    const client = await getRedisClient();
    const startTime = performance.now();

    // Drop existing index if it exists to ensure clean state
    try {
      await client.ft.dropIndex('idx:products');
    } catch (error: any) {
      // Index doesn't exist, which is fine
    }

    // Create search index for products with full-text, vector, and geo fields
    await client.ft.create(
      'idx:products',
      {
        '$.name': {
          type: SchemaFieldTypes.TEXT,
          AS: 'name',
        },
        '$.description': {
          type: SchemaFieldTypes.TEXT,
          AS: 'description',
        },
        '$.category': {
          type: SchemaFieldTypes.TAG,
          AS: 'category',
        },
        '$.price': {
          type: SchemaFieldTypes.NUMERIC,
          AS: 'price',
        },
        '$.location': {
          type: SchemaFieldTypes.GEO,
          AS: 'location',
        },
        '$.embedding': {
          type: SchemaFieldTypes.VECTOR,
          ALGORITHM: VectorAlgorithms.FLAT,
          TYPE: 'FLOAT32',
          DIM: 1536, // OpenAI text-embedding-3-small dimensions
          DISTANCE_METRIC: 'COSINE',
          AS: 'embedding',
        },
      },
      {
        ON: 'JSON',
        PREFIX: 'product:',
      }
    );

    // Generate and store product data
    console.log('Generating embeddings using OpenAI...');
    for (let i = 0; i < products.length; i++) {
      const product = products[i];

      // Generate embedding using OpenAI
      const textToEmbed = `${product.name}: ${product.description}`;
      console.log(`Generating embedding for: ${product.name}`);
      const embedding = await generateOpenAIEmbedding(textToEmbed);

      // Store the document - RediSearch will index it based on the schema
      await client.json.set(`product:${i}`, '$', {
        name: product.name,
        description: product.description,
        category: product.category,
        price: product.price,
        location: `${product.lon},${product.lat}`,
        // Store embedding as array of numbers for JSON storage
        embedding: Array.from(embedding),
      });
    }
    console.log('All embeddings generated successfully!');

    // Give RediSearch time to index documents
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verify indexing by checking index info
    const indexInfo = await client.ft.info('idx:products');
    const numDocs = indexInfo.numDocs;

    // Add geospatial data for locations
    // Clear existing location data first
    await client.del('locations');

    for (const location of locations) {
      console.log(`Adding location: ${location.name} at ${location.lon}, ${location.lat}`);
      await client.geoAdd('locations', {
        longitude: location.lon,
        latitude: location.lat,
        member: location.name,
      });
    }

    const executionTime = performance.now() - startTime;

    return NextResponse.json({
      success: true,
      message: 'Sample data generated successfully',
      productsCount: products.length,
      locationsCount: locations.length,
      indexedDocs: numDocs,
      executionTime,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
