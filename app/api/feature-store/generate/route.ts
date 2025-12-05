import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { count = 50 } = await request.json();

    const userIds = [
      'user_12345',
      'user_67890',
      'user_111',
      'user_alice',
      'user_bob',
      'user_charlie',
      'user_diana',
      'user_eve'
    ];

    const deviceIds = [
      'device_abc123',
      'device_def456',
      'device_ghi789',
      'device_jkl012',
      'device_mno345'
    ];

    const ipAddresses = [
      '192.168.1.1',
      '10.0.0.5',
      '172.16.0.10',
      '203.0.113.42',
      '198.51.100.7'
    ];

    const locations = [
      'New York, US',
      'London, UK',
      'Tokyo, Japan',
      'Sydney, Australia',
      'Paris, France',
      'Berlin, Germany',
      'Singapore, SG'
    ];

    let transactionsGenerated = 0;

    // Generate transactions
    for (let i = 0; i < count; i++) {
      const userId = userIds[Math.floor(Math.random() * userIds.length)];
      const amount = parseFloat((Math.random() * 500 + 10).toFixed(2));
      const deviceId = deviceIds[Math.floor(Math.random() * deviceIds.length)];
      const ipAddress = ipAddresses[Math.floor(Math.random() * ipAddresses.length)];
      const location = locations[Math.floor(Math.random() * locations.length)];

      // Spread transactions over the last 24 hours
      const timestamp = Date.now() - Math.floor(Math.random() * 24 * 60 * 60 * 1000);

      const transaction = {
        userId,
        amount,
        deviceId,
        ipAddress,
        location,
        timestamp
      };

      // Call compute endpoint to process transaction
      const response = await fetch(`${request.nextUrl.origin}/api/feature-store/compute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transaction })
      });

      if (response.ok) {
        transactionsGenerated++;
      }

      // Small delay to avoid overwhelming the system
      if (i % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return NextResponse.json({
      success: true,
      transactionsGenerated
    });

  } catch (error) {
    console.error('Error generating sample data:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to generate sample data'
    }, { status: 500 });
  }
}
