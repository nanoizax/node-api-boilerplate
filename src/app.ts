import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';

import { env } from './shared/config/env.js';
import { errorHandler } from './presentation/middlewares/errorHandler.js';
import { requestLogger } from './presentation/middlewares/requestLogger.js';

import { pool } from './infrastructure/database/pool.js';
import { PgUserRepository } from './infrastructure/database/repositories/PgUserRepository.js';
import { PgRefreshTokenRepository } from './infrastructure/database/repositories/PgRefreshTokenRepository.js';
import { TokenService } from './infrastructure/services/TokenService.js';

import { RegisterUser } from './application/use-cases/auth/RegisterUser.js';
import { LoginUser } from './application/use-cases/auth/LoginUser.js';
import { RefreshTokens } from './application/use-cases/auth/RefreshTokens.js';
import { LogoutUser } from './application/use-cases/auth/LogoutUser.js';
import { GetUsers } from './application/use-cases/user/GetUsers.js';
import { GetUserById } from './application/use-cases/user/GetUserById.js';
import { UpdateUser } from './application/use-cases/user/UpdateUser.js';
import { DeleteUser } from './application/use-cases/user/DeleteUser.js';

import { AuthController } from './presentation/controllers/AuthController.js';
import { UserController } from './presentation/controllers/UserController.js';

import { createAuthRouter } from './presentation/routes/authRoutes.js';
import { createUserRouter } from './presentation/routes/userRoutes.js';
import { createHealthRouter } from './presentation/routes/healthRoutes.js';

export async function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(express.json({ limit: '10kb' }));
  app.use(requestLogger);

  const globalLimiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: { code: 'TOO_MANY_REQUESTS', message: 'Too many requests' } },
  });

  app.use(globalLimiter);

  const userRepository = new PgUserRepository(pool);
  const refreshTokenRepository = new PgRefreshTokenRepository(pool);
  const tokenService = new TokenService();

  const registerUser = new RegisterUser(userRepository);
  const loginUser = new LoginUser(userRepository, refreshTokenRepository, tokenService);
  const refreshTokens = new RefreshTokens(userRepository, refreshTokenRepository, tokenService);
  const logoutUser = new LogoutUser(refreshTokenRepository);
  const getUsers = new GetUsers(userRepository);
  const getUserById = new GetUserById(userRepository);
  const updateUser = new UpdateUser(userRepository);
  const deleteUser = new DeleteUser(userRepository);

  const authController = new AuthController(registerUser, loginUser, refreshTokens, logoutUser);
  const userController = new UserController(getUsers, getUserById, updateUser, deleteUser);

  const apiPrefix = `/api/${env.API_VERSION}`;

  app.use(`${apiPrefix}/health`, createHealthRouter(pool));
  app.use(`${apiPrefix}/auth`, authLimiter, createAuthRouter(authController));
  app.use(`${apiPrefix}/users`, createUserRouter(userController));

  if (env.NODE_ENV !== 'production') {
    const { swaggerSpec } = await import('../docs/swagger.js');
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    app.get('/api/docs.json', (_req, res) => res.json(swaggerSpec));
  }

  app.use(errorHandler);

  return app;
}
