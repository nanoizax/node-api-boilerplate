# node-api-boilerplate

Production-ready REST API built with **Node.js 22**, **TypeScript 5**, and **Clean Architecture**. Auth, CRUD, Swagger docs, Docker, and tests — ready to fork and ship.

## Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 22 + TypeScript 5 |
| Framework | Express 5 |
| Database | PostgreSQL 17 + node-postgres |
| Auth | JWT (access + refresh tokens) + bcrypt |
| Validation | Zod |
| Docs | Swagger UI |
| Logging | Winston (JSON in production) |
| Security | Helmet + CORS + rate limiting |
| Tests | Vitest |
| Container | Docker + Docker Compose |
| CI | GitHub Actions |

## Architecture

```
src/
├── domain/           # Entities and repository interfaces (no dependencies)
├── application/      # Use cases (business logic, depends only on domain)
├── infrastructure/   # PostgreSQL, TokenService (implements domain interfaces)
├── presentation/     # Express controllers, routes, middlewares, validators
└── shared/           # Config (Zod env), errors, logger
```

Dependency flow: `presentation → application → domain ← infrastructure`

## Quick Start

### With Docker (recommended)

```bash
git clone https://github.com/nanoizax/node-api-boilerplate
cd node-api-boilerplate
cp .env.example .env        # edit JWT_SECRET
docker compose up
```

API available at `http://localhost:3000`
Swagger UI at `http://localhost:3000/api/docs`

### Local development

```bash
npm install
cp .env.example .env        # configure DATABASE_URL and JWT_SECRET
npm run db:migrate
npm run dev
```

### Development with hot reload via Docker

```bash
docker compose --profile dev up api-dev postgres
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Min 32 characters |
| `JWT_ACCESS_EXPIRES_IN` | No | Default `15m` |
| `JWT_REFRESH_EXPIRES_IN` | No | Default `7d` |
| `PORT` | No | Default `3000` |
| `LOG_LEVEL` | No | `error\|warn\|info\|debug` |

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/auth/register` | Register user |
| `POST` | `/api/v1/auth/login` | Login → returns access + refresh tokens |
| `POST` | `/api/v1/auth/refresh` | Rotate tokens |
| `POST` | `/api/v1/auth/logout` | Invalidate refresh token |

### Users
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/v1/users/me` | User | Get own profile |
| `PUT` | `/api/v1/users/me` | User | Update own profile |
| `GET` | `/api/v1/users` | Admin | List users (paginated) |
| `GET` | `/api/v1/users/:id` | Admin | Get user by ID |
| `PUT` | `/api/v1/users/:id` | Admin | Update any user |
| `DELETE` | `/api/v1/users/:id` | Admin | Delete user |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/health` | Health check + DB status |

## Testing

```bash
npm test                  # run all tests
npm run test:coverage     # with coverage report
npm run test:watch        # watch mode
```

## Scripts

```bash
npm run dev           # start development server (hot reload)
npm run build         # compile TypeScript
npm run start         # start production build
npm run lint          # ESLint
npm run format        # Prettier
npm run type-check    # TypeScript type check
npm run db:migrate    # run pending migrations
```

## Project Conventions

- **Conventional Commits**: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`
- **Error handling**: Centralized via `AppError` class with typed status codes
- **Validation**: Zod schemas at presentation boundary, not in use cases
- **Env validation**: All variables validated at startup via Zod
- **No ORM**: Raw SQL with pg for full control and performance

## License

MIT — Leandro Perez · [SonhoLab](https://sonholab.com) · contacto@sonholab.com
