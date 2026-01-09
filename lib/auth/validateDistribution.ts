import { NextRequest } from 'next/server'

/**
 * Validate authentication header for distribution API routes
 * Supports Bearer token or X-DISTRIBUTION-SECRET header
 */
export function validateAuth(request: NextRequest): boolean {
  const secret = process.env.DISTRIBUTION_SECRET
  if (!secret) {
    console.warn('DISTRIBUTION_SECRET is not set')
    return false
  }

  // Check Bearer token first
  const authHeader = request.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    return token === secret
  }

  // Fallback to X-DISTRIBUTION-SECRET header
  const headerSecret = request.headers.get('X-DISTRIBUTION-SECRET')
  return headerSecret === secret
}
