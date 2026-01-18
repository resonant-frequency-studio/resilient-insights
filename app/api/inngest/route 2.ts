/**
 * Inngest API route handler
 * This endpoint is called by Inngest to serve functions
 */

import { serve } from 'inngest/next'
import { publishScheduledPost, checkScheduledPosts } from '../inngest/functions'
import { inngest } from '@/lib/inngest/client'

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [publishScheduledPost, checkScheduledPosts],
})
