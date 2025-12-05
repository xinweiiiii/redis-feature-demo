import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';

interface Transaction {
  userId: string;
  amount: number;
  deviceId: string;
  ipAddress: string;
  location: string;
  timestamp: number;
}

export async function POST(request: NextRequest) {
  try {
    const redis = await getRedisClient();
    const { transaction } = await request.json() as { transaction: Transaction };

    if (!transaction || !transaction.userId) {
      return NextResponse.json({
        success: false,
        error: 'Invalid transaction data'
      }, { status: 400 });
    }

    const { userId, amount, deviceId, ipAddress, location, timestamp } = transaction;
    const featureKey = `features:${userId}`;
    const transactionKey = `transactions:${userId}`;

    // Time windows
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    const oneDayAgo = now - (24 * 60 * 60 * 1000);

    // Store transaction
    await redis.zAdd(transactionKey, {
      score: timestamp,
      value: JSON.stringify({
        amount,
        deviceId,
        ipAddress,
        location,
        timestamp
      })
    });

    // Set expiry on transaction data (7 days)
    await redis.expire(transactionKey, 7 * 24 * 60 * 60);

    // Track devices and IPs
    await redis.sAdd(`devices:${userId}`, deviceId);
    await redis.sAdd(`ips:${userId}`, ipAddress);
    await redis.expire(`devices:${userId}`, 7 * 24 * 60 * 60);
    await redis.expire(`ips:${userId}`, 7 * 24 * 60 * 60);

    // Get transaction counts
    const transactions24h = await redis.zCount(transactionKey, oneDayAgo, now);
    const transactions1h = await redis.zCount(transactionKey, oneHourAgo, now);

    // Get all transactions for amount calculations
    const recentTransactions = await redis.zRangeByScore(transactionKey, oneDayAgo, now);
    const amounts = recentTransactions.map((txStr: string) => {
      try {
        return JSON.parse(txStr).amount;
      } catch {
        return 0;
      }
    });

    const avgAmount = amounts.length > 0
      ? amounts.reduce((a: number, b: number) => a + b, 0) / amounts.length
      : amount;
    const maxAmount = amounts.length > 0
      ? Math.max(...amounts)
      : amount;

    // Get device and IP counts
    const distinctDevicesCount = await redis.sCard(`devices:${userId}`);
    const distinctIpCount = await redis.sCard(`ips:${userId}`);

    // Get account age (simulate - in real scenario this would come from user profile)
    let accountAgeDays = await redis.get(`account_age:${userId}`);
    if (!accountAgeDays) {
      accountAgeDays = String(Math.floor(Math.random() * 365) + 30); // Random between 30-395 days
      await redis.setEx(`account_age:${userId}`, 30 * 24 * 60 * 60, accountAgeDays);
    }

    // Get failed login attempts (simulate)
    let failedLoginAttempts = await redis.get(`failed_logins:${userId}`);
    if (!failedLoginAttempts) {
      failedLoginAttempts = String(Math.floor(Math.random() * 5));
      await redis.setEx(`failed_logins:${userId}`, 24 * 60 * 60, failedLoginAttempts);
    }

    // Get last transaction timestamp
    const lastTx = await redis.get(`last_tx:${userId}`);
    const lastTransactionTimestamp = lastTx ? parseInt(lastTx) : timestamp;
    await redis.set(`last_tx:${userId}`, String(timestamp));

    // Calculate fraud score based on features
    let fraudScore = 0;

    // High transaction velocity (weight: 0.25)
    if (transactions1h > 5) fraudScore += 0.25;
    else if (transactions1h > 3) fraudScore += 0.15;

    // Unusual transaction amount (weight: 0.2)
    if (amount > avgAmount * 3) fraudScore += 0.2;
    else if (amount > avgAmount * 2) fraudScore += 0.1;

    // Multiple devices/IPs (weight: 0.2)
    if (distinctDevicesCount > 3) fraudScore += 0.15;
    if (distinctIpCount > 3) fraudScore += 0.05;

    // New account (weight: 0.15)
    if (parseInt(accountAgeDays) < 30) fraudScore += 0.15;
    else if (parseInt(accountAgeDays) < 90) fraudScore += 0.08;

    // Failed logins (weight: 0.2)
    if (parseInt(failedLoginAttempts) > 3) fraudScore += 0.2;
    else if (parseInt(failedLoginAttempts) > 1) fraudScore += 0.1;

    // Cap fraud score at 1.0
    fraudScore = Math.min(fraudScore, 1.0);

    // Store computed features
    const features = {
      userId,
      transactionCount24h: transactions24h,
      transactionCount1h: transactions1h,
      avgTransactionAmount: avgAmount,
      maxTransactionAmount: maxAmount,
      accountAgeDays: parseInt(accountAgeDays),
      failedLoginAttempts: parseInt(failedLoginAttempts),
      distinctDevicesCount,
      distinctIpCount,
      lastTransactionTimestamp,
      fraudScore,
      updatedAt: now
    };

    // Store as hash - convert all values to strings for Redis
    const hashData: Record<string, string> = {};
    Object.entries(features).forEach(([key, value]) => {
      hashData[key] = String(value);
    });

    await redis.hSet(featureKey, hashData);
    await redis.expire(featureKey, 24 * 60 * 60); // Expire in 24 hours

    // Track in global user set
    await redis.sAdd('feature_store:users', userId);

    // Increment global transaction counter
    await redis.incr('feature_store:total_transactions');

    return NextResponse.json({
      success: true,
      features
    });

  } catch (error) {
    console.error('Error computing features:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to compute features'
    }, { status: 500 });
  }
}
