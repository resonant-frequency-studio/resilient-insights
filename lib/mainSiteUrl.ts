/**
 * Get the main site URL based on the current environment
 * - Local/staging: staging.resilientleadership.us
 * - Production: resilientleadership.us
 *
 * For client components, detects from window.location.hostname
 * For server components, uses VERCEL_ENV (automatically set by Vercel)
 */
export function getMainSiteUrl(): string {
  // Client-side: check window.location.hostname
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    if (
      hostname === 'staging.resilientleadership.us' ||
      hostname === 'articles.staging.resilientleadership.us' ||
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.startsWith('192.168.')
    ) {
      return 'https://staging.resilientleadership.us'
    }
    // Production
    return 'https://resilientleadership.us'
  }

  // Server-side: use VERCEL_ENV (automatically set by Vercel)
  // VERCEL_ENV is 'production' for production, 'preview' for staging, 'development' for local
  const vercelEnv = process.env.VERCEL_ENV
  if (vercelEnv === 'production') {
    return 'https://resilientleadership.us'
  }
  // Preview (staging) or development
  return 'https://staging.resilientleadership.us'
}
