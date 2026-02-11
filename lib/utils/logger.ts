/**
 * Logger utility that only logs in development environment
 * Suppresses all logs in staging, production, and test environments
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
 * This ensures logs only appear in local development, never in staging or production.
 */
const isDevelopment = process.env.NODE_ENV === 'development'

/**
 * Log a warning message (only in development)
 */
export function logWarn(...args: unknown[]): void {
  if (isDevelopment) {
    console.warn(...args)
  }
}

/**
 * Log an error message (only in development)
 */
export function logError(...args: unknown[]): void {
  if (isDevelopment) {
    console.error(...args)
  }
}
