import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';
import { SchemaFieldTypes, VectorAlgorithms } from 'redis';
import { generateOpenAIEmbedding } from '@/lib/embeddings';

// Sample product data with semantically similar items to demonstrate search capabilities
const products = [
  // Electronics - Portable Computing Devices (semantically similar)
  { name: 'Laptop', description: 'High-performance laptop for developers', category: 'Electronics', price: 1299, lat: 37.7749, lon: -122.4194 },
  { name: 'Notebook Computer', description: 'Lightweight notebook for students and professionals', category: 'Electronics', price: 899, lat: 37.7849, lon: -122.4094 },
  { name: 'Ultrabook', description: 'Ultra-thin portable computer with long battery life', category: 'Electronics', price: 1499, lat: 37.7649, lon: -122.4294 },
  { name: 'MacBook', description: 'Apple MacBook Pro for creative work', category: 'Electronics', price: 1999, lat: 37.7549, lon: -122.4394 },
  { name: 'Chromebook', description: 'Budget-friendly portable computer for web browsing', category: 'Electronics', price: 399, lat: 37.7449, lon: -122.4494 },

  // Electronics - Mobile Devices
  { name: 'Smartphone', description: 'Latest smartphone with amazing camera', category: 'Electronics', price: 899, lat: 37.7849, lon: -122.4094 },
  { name: 'Mobile Phone', description: 'Feature-rich mobile phone with 5G connectivity', category: 'Electronics', price: 699, lat: 37.7749, lon: -122.3994 },
  { name: 'iPhone', description: 'Apple iPhone with advanced features', category: 'Electronics', price: 1099, lat: 37.7649, lon: -122.4194 },

  // Electronics - Audio Equipment
  { name: 'Headphones', description: 'Noise-cancelling wireless headphones', category: 'Electronics', price: 299, lat: 37.7649, lon: -122.4294 },
  { name: 'Earbuds', description: 'True wireless earbuds with charging case', category: 'Electronics', price: 199, lat: 37.7549, lon: -122.4194 },
  { name: 'Studio Monitors', description: 'Professional audio headphones for music production', category: 'Electronics', price: 399, lat: 37.7449, lon: -122.4094 },

  // Home - Coffee Making Equipment (semantically similar)
  { name: 'Coffee Maker', description: 'Automatic coffee maker with timer', category: 'Home', price: 129, lat: 40.7128, lon: -74.0060 },
  { name: 'Espresso Machine', description: 'Professional espresso machine for barista-quality coffee', category: 'Home', price: 499, lat: 40.7228, lon: -74.0160 },
  { name: 'French Press', description: 'Manual French press for rich coffee brewing', category: 'Home', price: 39, lat: 40.7028, lon: -73.9960 },
  { name: 'Pour Over Brewer', description: 'Precision pour-over coffee maker for artisan brewing', category: 'Home', price: 79, lat: 40.7328, lon: -74.0260 },
  { name: 'Drip Coffee Brewer', description: 'Classic drip coffee brewer with programmable settings', category: 'Home', price: 149, lat: 40.6928, lon: -73.9860 },

  // Home - Kitchen Appliances
  { name: 'Blender', description: 'High-speed blender for smoothies', category: 'Home', price: 89, lat: 40.7228, lon: -74.0160 },
  { name: 'Food Processor', description: 'Multi-function food processor for meal prep', category: 'Home', price: 159, lat: 40.7128, lon: -74.0260 },
  { name: 'Vacuum Cleaner', description: 'Robot vacuum with smart navigation', category: 'Home', price: 399, lat: 40.7028, lon: -73.9960 },

  // Sports - Running/Athletic Footwear (semantically similar)
  { name: 'Running Shoes', description: 'Lightweight running shoes for marathons', category: 'Sports', price: 149, lat: 34.0522, lon: -118.2437 },
  { name: 'Athletic Sneakers', description: 'Versatile athletic sneakers for training', category: 'Sports', price: 119, lat: 34.0622, lon: -118.2537 },
  { name: 'Marathon Runners', description: 'Professional marathon running shoes', category: 'Sports', price: 179, lat: 34.0422, lon: -118.2337 },
  { name: 'Training Shoes', description: 'Cross-training shoes for gym workouts', category: 'Sports', price: 129, lat: 34.0522, lon: -118.2237 },
  { name: 'Trail Running Shoes', description: 'Rugged shoes for trail running and hiking', category: 'Sports', price: 159, lat: 34.0322, lon: -118.2437 },

  // Sports - Fitness Equipment
  { name: 'Yoga Mat', description: 'Non-slip yoga mat with carrying strap', category: 'Sports', price: 39, lat: 34.0622, lon: -118.2537 },
  { name: 'Exercise Mat', description: 'Thick cushioned mat for floor exercises', category: 'Sports', price: 49, lat: 34.0722, lon: -118.2637 },
  { name: 'Weights', description: 'Adjustable weights set', category: 'Sports', price: 199, lat: 34.0422, lon: -118.2337 },
  { name: 'Dumbbells', description: 'Pair of rubber-coated dumbbells', category: 'Sports', price: 89, lat: 34.0522, lon: -118.2137 },
  { name: 'Kettlebell', description: 'Cast iron kettlebell for strength training', category: 'Sports', price: 59, lat: 34.0322, lon: -118.2537 },

  // Furniture - Office/Workspace (semantically similar)
  { name: 'Office Chair', description: 'Ergonomic office chair with lumbar support', category: 'Furniture', price: 349, lat: 41.8781, lon: -87.6298 },
  { name: 'Desk Chair', description: 'Comfortable desk chair for long work hours', category: 'Furniture', price: 299, lat: 41.8881, lon: -87.6398 },
  { name: 'Executive Chair', description: 'Premium leather executive office chair', category: 'Furniture', price: 549, lat: 41.8681, lon: -87.6198 },
  { name: 'Standing Desk', description: 'Electric height-adjustable standing desk', category: 'Furniture', price: 599, lat: 41.8881, lon: -87.6398 },
  { name: 'Sit-Stand Workstation', description: 'Adjustable workstation for ergonomic sitting and standing', category: 'Furniture', price: 499, lat: 41.8781, lon: -87.6498 },
  { name: 'Computer Desk', description: 'Spacious computer desk with cable management', category: 'Furniture', price: 279, lat: 41.8981, lon: -87.6298 },

  // Furniture - Storage
  { name: 'Bookshelf', description: 'Wooden bookshelf with 5 shelves', category: 'Furniture', price: 179, lat: 41.8681, lon: -87.6198 },
  { name: 'Storage Shelf', description: 'Metal storage shelf for garage or office', category: 'Furniture', price: 149, lat: 41.8581, lon: -87.6098 },
  { name: 'Display Cabinet', description: 'Glass display cabinet for collectibles', category: 'Furniture', price: 399, lat: 41.8781, lon: -87.6098 },
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
