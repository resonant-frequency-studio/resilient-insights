/**
 * Get the main site URL based on the current environment
 * - Local/staging: staging.resilientleadership.us
 * - Production: resilientleadership.us
 *
 * Uses NEXT_PUBLIC_ENV so it works in both client + server code.
 * - production -> production URL
 * - staging -> staging URL
 * - development (or unset/unknown) -> staging URL
 */
export function getMainSiteUrl(): string {
  const env = process.env.NEXT_PUBLIC_ENV || 'development'

  switch (env) {
    case 'production':
      return 'https://resilientleadership.us'
    case 'staging':
      return 'https://staging.resilientleadership.us'
    default:
      // development or any other value defaults to staging
      return 'https://staging.resilientleadership.us'
  }
}
