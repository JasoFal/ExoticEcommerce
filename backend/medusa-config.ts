import { loadEnv, defineConfig, MedusaError, Modules } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

const redisUrl = process.env.REDIS_URL

// In-memory modules are a local-dev fallback only (CLAUDE.md). Production
// must never boot without Redis.
if (process.env.NODE_ENV === 'production' && !redisUrl) {
  throw new MedusaError(
    MedusaError.Types.INVALID_ARGUMENT,
    'REDIS_URL is required when NODE_ENV=production'
  )
}

// Event bus, workflow engine, and locking move to Redis when REDIS_URL is
// set. Caching is deliberately not wired yet (docs/ci-cd-plan.md section 3.1).
const redisModules = redisUrl
  ? [
      {
        key: Modules.EVENT_BUS,
        resolve: '@medusajs/medusa/event-bus-redis',
        options: { redisUrl },
      },
      {
        key: Modules.WORKFLOW_ENGINE,
        resolve: '@medusajs/medusa/workflow-engine-redis',
        options: { redis: { redisUrl } },
      },
      {
        key: Modules.LOCKING,
        resolve: '@medusajs/medusa/locking',
        options: {
          providers: [
            {
              resolve: '@medusajs/medusa/locking-redis',
              id: 'locking-redis',
              is_default: true,
              options: { redisUrl },
            },
          ],
        },
      },
    ]
  : []

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    }
  },
  modules: redisModules,
})
