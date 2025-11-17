import {
  createSupabaseClient,
  checkDatabaseConnection,
  getRedisConnection,
  checkRedisConnection,
  createLogger,
  initSentry,
} from './src';

async function test() {
  // Initialize monitoring
  initSentry({
    dsn: process.env.SENTRY_DSN,
    environment: 'development',
    tracesSampleRate: 1.0,
  });

  // Create logger
  const logger = createLogger({
    level: 'info',
    service: 'test',
  });

  logger.info('Testing shared package...');

  // Test database
  try {
    createSupabaseClient();
    const dbOk = await checkDatabaseConnection();
    logger.info('Database connection', { status: dbOk ? 'OK' : 'FAILED' });
  } catch (error: any) {
    logger.error('Database error', { error: error.message });
  }

  // Test Redis
  try {
    getRedisConnection();
    const redisOk = await checkRedisConnection();
    logger.info('Redis connection', { status: redisOk ? 'OK' : 'FAILED' });
  } catch (error: any) {
    logger.error('Redis error', { error: error.message });
  }

  process.exit(0);
}

test();