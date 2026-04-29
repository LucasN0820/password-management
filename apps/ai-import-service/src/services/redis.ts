import Redis from 'ioredis';

let redis: Redis;

export function initRedis(): Redis {
  const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';

  redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });

  redis.on('error', error => {
    console.error('Redis connection error:', error.message);
  });

  return redis;
}

export function getRedis(): Redis {
  if (!redis) {
    throw new Error('Redis not initialized. Call initRedis() first.');
  }
  return redis;
}
