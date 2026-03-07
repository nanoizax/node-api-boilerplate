FROM node:22-alpine AS base
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 api

COPY --from=builder --chown=api:nodejs /app/dist ./dist
COPY --from=deps --chown=api:nodejs /app/node_modules ./node_modules
COPY --chown=api:nodejs package.json ./

USER api
EXPOSE 3000
CMD ["node", "dist/index.js"]
