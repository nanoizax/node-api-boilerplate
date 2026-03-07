import { createApp } from './app.js';
import { env } from './shared/config/env.js';
import { logger } from './shared/logger/logger.js';
import { testConnection } from './infrastructure/database/pool.js';
import { runMigrations } from './infrastructure/database/migrate.js';
import { pool } from './infrastructure/database/pool.js';

async function bootstrap() {
  await testConnection();
  await runMigrations();

  const app = await createApp();

  const server = app.listen(env.PORT, () => {
    logger.info(`Server running on port ${env.PORT}`, {
      env: env.NODE_ENV,
      docs: env.NODE_ENV !== 'production' ? `http://localhost:${env.PORT}/api/docs` : null,
    });
  });

  const shutdown = async (signal: string) => {
    logger.info(`${signal} received, shutting down gracefully`);
    server.close(async () => {
      await pool.end();
      logger.info('Server closed');
      process.exit(0);
    });

    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  logger.error('Failed to start server', { error: err.message });
  process.exit(1);
});
