import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';

export async function POST(request: NextRequest) {
  try {
    const { latitude, longitude, radius, unit = 'km' } = await request.json();

    if (latitude === undefined || longitude === undefined || !radius) {
      return NextResponse.json(
        { success: false, error: 'Latitude, longitude, and radius are required' },
        { status: 400 }
      );
    }

    const client = await getRedisClient();
    const startTime = performance.now();

    // Search for locations within radius using GEOSEARCH
    // Use sendCommand to get raw Redis response with WITHDIST and WITHCOORD
    const results = await client.sendCommand([
      'GEOSEARCH',
      'locations',
      'FROMLONLAT',
      String(parseFloat(longitude)),
      String(parseFloat(latitude)),
      'BYRADIUS',
      String(parseFloat(radius)),
      unit,
      'WITHDIST',
      'WITHCOORD',
    ]) as any;

    // Debug: log the raw results
    console.log('GeoSearch raw results:', JSON.stringify(results, null, 2));

    const locations = results.map((result: any) => {
      // Log each individual result to understand the structure
      console.log('Individual result:', JSON.stringify(result, null, 2));
      console.log('Result type:', typeof result, 'Is array:', Array.isArray(result));

      // Redis geoSearch with WITHDIST and WITHCOORD returns different formats
      // Handle both object and array formats
      let name, distance, coords;

      if (typeof result === 'object' && !Array.isArray(result) && result.member) {
        // Object format: { member, distance, coordinates }
        console.log('Parsing as object format');
        name = result.member;
        distance = parseFloat(result.distance) || 0;
        coords = result.coordinates || {};
      } else if (Array.isArray(result)) {
        // Array format: [member, distance, [longitude, latitude]]
        console.log('Parsing as array format');
        name = result[0];
        distance = parseFloat(result[1]) || 0;
        coords = { longitude: result[2]?.[0] || 0, latitude: result[2]?.[1] || 0 };
      } else if (typeof result === 'string') {
        // Simple string format (member name only)
        console.log('Parsing as string format');
        name = result;
        distance = 0;
        coords = { longitude: 0, latitude: 0 };
      } else {
        // Unknown format - try to extract any available data
        console.log('Unknown format, trying to extract data');
        name = result.member || result.name || result[0] || String(result);
        distance = parseFloat(result.distance || result[1] || 0);
        coords = result.coordinates || result.coord || result[2] || {};
      }

      console.log(coords)

      const location = {
        name,
        distance,
        coordinates: {
          longitude: coords.longitude || coords.x || coords[0] || 0,
          latitude: coords.latitude || coords.y || coords[1] || 0,
        },
      };

      console.log('Parsed location:', JSON.stringify(location, null, 2));

      return location;
    });

    const executionTime = performance.now() - startTime;

    // Debug: log the processed locations
    console.log('Processed locations:', JSON.stringify(locations, null, 2));

    return NextResponse.json({
      success: true,
      locations,
      count: locations.length,
      executionTime,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
