'use client'

import { useEffect, useState } from 'react'
import { checkRateLimitStatus } from '../../plugins/distribution/actions'

type RateLimitContentType = Parameters<typeof checkRateLimitStatus>[1]

export function useRateLimitCountdown(
  postId: string | undefined,
  contentType: RateLimitContentType
) {
  const [rateLimitRemainingSeconds, setRateLimitRemainingSeconds] = useState(0)

  useEffect(() => {
    if (!postId) return

    const checkRateLimit = async () => {
      const status = await checkRateLimitStatus(postId, contentType)
      if (status.rateLimited) {
        const seconds = Math.ceil(status.remainingMs / 1000)
        setRateLimitRemainingSeconds(seconds)
      } else {
        setRateLimitRemainingSeconds(0)
      }
    }

    checkRateLimit()
    const interval = setInterval(checkRateLimit, 1000)

    return () => clearInterval(interval)
  }, [postId, contentType])

  return {
    rateLimitRemainingSeconds,
    setRateLimitRemainingSeconds,
  }
}
