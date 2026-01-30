/**
 * Smart scheduling recommendations
 * Provides optimal posting times based on industry benchmarks
 */

export type Channel = 'linkedin' | 'facebook' | 'instagram'

/**
 * Industry benchmark optimal posting times (in hours, 24-hour format)
 * Times are in the user's local timezone
 */
const OPTIMAL_TIMES: Record<Channel, number[]> = {
  linkedin: [9, 12, 17], // 9 AM, 12 PM, 5 PM (weekdays)
  facebook: [9, 13, 19], // 9 AM, 1 PM, 7 PM
  instagram: [11, 14, 17, 20], // 11 AM, 2 PM, 5 PM, 8 PM
}

/**
 * Get recommended posting times for a specific date
 * @param channel - Social media channel
 * @param date - Date to get recommendations for
 * @param timezone - Timezone (default: UTC)
 * @param count - Number of recommendations to return (default: 5)
 */
export function getRecommendedTimes(
  channel: Channel,
  date: Date,
  timezone: string = 'UTC',
  count: number = 5
): Date[] {
  const times = OPTIMAL_TIMES[channel] || OPTIMAL_TIMES.linkedin
  const recommendations: Date[] = []

  // We currently generate recommendations in the server/user's local timezone.
  // The `timezone` argument is accepted for API compatibility and for formatting
  // elsewhere; here we just validate it when provided.
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone }).format(date)
  } catch {
    // Ignore invalid timezone strings and fall back to local behavior.
  }

  // Get the date at midnight (local)
  const targetDate = new Date(date)
  targetDate.setHours(0, 0, 0, 0)

  // For each optimal time, create a Date object
  for (const hour of times) {
    const recommendedTime = new Date(targetDate)
    recommendedTime.setHours(hour, 0, 0, 0)

    // Only include times that are in the future
    if (recommendedTime > new Date()) {
      recommendations.push(recommendedTime)
    }
  }

  // If we need more recommendations, add times from next day
  if (recommendations.length < count) {
    const nextDay = new Date(targetDate)
    nextDay.setDate(nextDay.getDate() + 1)

    for (const hour of times) {
      if (recommendations.length >= count) break

      const recommendedTime = new Date(nextDay)
      recommendedTime.setHours(hour, 0, 0, 0)
      recommendations.push(recommendedTime)
    }
  }

  // Sort by time and return requested count
  return recommendations
    .sort((a, b) => a.getTime() - b.getTime())
    .slice(0, count)
}

/**
 * Check if a given time is optimal for posting
 */
export function isOptimalTime(channel: Channel, dateTime: Date): boolean {
  const hour = dateTime.getHours()
  const optimalHours = OPTIMAL_TIMES[channel] || OPTIMAL_TIMES.linkedin
  return optimalHours.includes(hour)
}

/**
 * Get next N optimal times starting from a given date
 */
export function getNextOptimalTimes(
  channel: Channel,
  startDate: Date,
  count: number = 5
): Date[] {
  const recommendations: Date[] = []
  let currentDate = new Date(startDate)
  const maxDays = 7 // Look ahead up to 7 days

  for (let day = 0; day < maxDays && recommendations.length < count; day++) {
    const dayRecommendations = getRecommendedTimes(
      channel,
      currentDate,
      'UTC',
      count
    )
    recommendations.push(...dayRecommendations)

    // Move to next day
    currentDate = new Date(currentDate)
    currentDate.setDate(currentDate.getDate() + 1)
  }

  // Filter to only future times and sort
  const now = new Date()
  return recommendations
    .filter(time => time > now)
    .sort((a, b) => a.getTime() - b.getTime())
    .slice(0, count)
}

/**
 * Format time for display
 */
export function formatRecommendedTime(date: Date, timezone?: string): string {
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: timezone,
  })
}
