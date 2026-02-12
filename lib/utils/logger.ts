/**
 * Logger utility
 * - Development: logs to console for local debugging
 * - Staging/production: sends warnings/errors to Sentry
 * - Test: no-op to keep test output clean
 *
 * Uses NODE_ENV which is automatically set by Next.js:
 * - 'development' when running `npm run dev` (local dev)
 * - 'production' when running `npm run build` or `npm start` (staging/production)
 * - 'test' when running tests
 *
 * NODE_ENV works in both:
 * - Server-side code (API routes, server components, server utilities)
 * - Client-side code (client components) - Next.js inlines it at build time
 *
 * This ensures logs are visible in development and observable in non-development environments.
 */
import * as Sentry from '@sentry/nextjs'

const isDevelopment = process.env.NODE_ENV === 'development'
const isTest = process.env.NODE_ENV === 'test'

function toError(args: unknown[]): Error {
  const first = args[0]
  if (first instanceof Error) {
    return first
  }

  const text =
    first === undefined
      ? 'Unknown error'
      : typeof first === 'string'
        ? first
        : JSON.stringify(first)

  return new Error(text)
}

/**
 * Log a warning message
 */
export function logWarn(...args: unknown[]): void {
  if (isDevelopment) {
    console.warn(...args)
    return
  }

  if (isTest) {
    return
  }

  const message = args
    .map(arg => (typeof arg === 'string' ? arg : JSON.stringify(arg)))
    .join(' ')

  Sentry.captureMessage(message || 'Warning', 'warning')
}

/**
 * Log an error message
 */
export function logError(...args: unknown[]): void {
  if (isDevelopment) {
    console.error(...args)
    return
  }

  if (isTest) {
    return
  }

  Sentry.withScope(scope => {
    if (args.length > 1) {
      scope.setContext('logger', {
        extra: args
          .slice(1)
          .map(arg => (typeof arg === 'string' ? arg : JSON.stringify(arg))),
      })
    }
    Sentry.captureException(toError(args))
  })
}
