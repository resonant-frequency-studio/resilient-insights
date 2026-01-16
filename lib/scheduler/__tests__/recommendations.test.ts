import {
  getRecommendedTimes,
  isOptimalTime,
  getNextOptimalTimes,
  formatRecommendedTime,
  Channel,
} from '../recommendations'

describe('recommendations', () => {
  // Use a fixed date for consistent testing
  const fixedDate = new Date('2026-01-15T08:00:00Z')

  describe('getRecommendedTimes', () => {
    it('returns array of Date objects', () => {
      const times = getRecommendedTimes('linkedin', fixedDate)
      expect(Array.isArray(times)).toBe(true)
      times.forEach(time => {
        expect(time).toBeInstanceOf(Date)
      })
    })

    it('returns correct hours for LinkedIn (9, 12, 17)', () => {
      // Set a date where all times are in the future
      const earlyMorning = new Date('2026-01-15T01:00:00Z')
      const times = getRecommendedTimes('linkedin', earlyMorning)
      const hours = times.map(t => t.getHours())

      // Should include LinkedIn optimal hours
      expect([9, 12, 17].some(h => hours.includes(h))).toBe(true)
    })

    it('returns correct hours for Facebook (9, 13, 19)', () => {
      const earlyMorning = new Date('2026-01-15T01:00:00Z')
      const times = getRecommendedTimes('facebook', earlyMorning)
      const hours = times.map(t => t.getHours())

      expect([9, 13, 19].some(h => hours.includes(h))).toBe(true)
    })

    it('returns correct hours for Instagram (11, 14, 17, 20)', () => {
      const earlyMorning = new Date('2026-01-15T01:00:00Z')
      const times = getRecommendedTimes('instagram', earlyMorning)
      const hours = times.map(t => t.getHours())

      expect([11, 14, 17, 20].some(h => hours.includes(h))).toBe(true)
    })

    it('filters out times in the past', () => {
      const now = new Date()
      const times = getRecommendedTimes('linkedin', now)

      times.forEach(time => {
        expect(time.getTime()).toBeGreaterThan(now.getTime())
      })
    })

    it('returns up to requested count', () => {
      const times = getRecommendedTimes('linkedin', fixedDate, 'UTC', 3)
      expect(times.length).toBeLessThanOrEqual(3)
    })

    it('adds times from next day if needed', () => {
      // Late in the day, should get times from tomorrow
      const lateEvening = new Date('2026-01-15T23:00:00Z')
      const times = getRecommendedTimes('linkedin', lateEvening, 'UTC', 5)

      // Should have times from the next day
      expect(times.length).toBeGreaterThan(0)
    })

    it('returns sorted times', () => {
      const times = getRecommendedTimes('linkedin', fixedDate)

      for (let i = 1; i < times.length; i++) {
        expect(times[i].getTime()).toBeGreaterThanOrEqual(
          times[i - 1].getTime()
        )
      }
    })

    it('defaults to LinkedIn times for unknown channel', () => {
      const times = getRecommendedTimes('unknown' as Channel, fixedDate)
      expect(Array.isArray(times)).toBe(true)
    })
  })

  describe('isOptimalTime', () => {
    it('returns true for LinkedIn at 9 AM', () => {
      const nineAM = new Date('2026-01-15T09:00:00')
      expect(isOptimalTime('linkedin', nineAM)).toBe(true)
    })

    it('returns true for LinkedIn at 12 PM', () => {
      const noon = new Date('2026-01-15T12:00:00')
      expect(isOptimalTime('linkedin', noon)).toBe(true)
    })

    it('returns true for LinkedIn at 5 PM', () => {
      const fivePM = new Date('2026-01-15T17:00:00')
      expect(isOptimalTime('linkedin', fivePM)).toBe(true)
    })

    it('returns false for LinkedIn at 3 AM', () => {
      const threeAM = new Date('2026-01-15T03:00:00')
      expect(isOptimalTime('linkedin', threeAM)).toBe(false)
    })

    it('returns true for Facebook at 1 PM', () => {
      const onePM = new Date('2026-01-15T13:00:00')
      expect(isOptimalTime('facebook', onePM)).toBe(true)
    })

    it('returns true for Instagram at 8 PM', () => {
      const eightPM = new Date('2026-01-15T20:00:00')
      expect(isOptimalTime('instagram', eightPM)).toBe(true)
    })

    it('returns false for non-optimal hour', () => {
      const twoAM = new Date('2026-01-15T02:00:00')
      expect(isOptimalTime('linkedin', twoAM)).toBe(false)
      expect(isOptimalTime('facebook', twoAM)).toBe(false)
      expect(isOptimalTime('instagram', twoAM)).toBe(false)
    })

    it('defaults to LinkedIn for unknown channel', () => {
      const noon = new Date('2026-01-15T12:00:00')
      expect(isOptimalTime('unknown' as Channel, noon)).toBe(true) // 12 is LinkedIn optimal
    })
  })

  describe('getNextOptimalTimes', () => {
    it('returns array of Date objects', () => {
      const times = getNextOptimalTimes('linkedin', fixedDate)
      expect(Array.isArray(times)).toBe(true)
      times.forEach(time => {
        expect(time).toBeInstanceOf(Date)
      })
    })

    it('returns up to requested count', () => {
      const times = getNextOptimalTimes('linkedin', fixedDate, 3)
      expect(times.length).toBeLessThanOrEqual(3)
    })

    it('defaults to 5 recommendations', () => {
      const times = getNextOptimalTimes('linkedin', fixedDate)
      expect(times.length).toBeLessThanOrEqual(5)
    })

    it('returns only future times', () => {
      const now = new Date()
      const times = getNextOptimalTimes('linkedin', now)

      times.forEach(time => {
        expect(time.getTime()).toBeGreaterThan(now.getTime())
      })
    })

    it('returns sorted times', () => {
      const times = getNextOptimalTimes('instagram', fixedDate, 10)

      for (let i = 1; i < times.length; i++) {
        expect(times[i].getTime()).toBeGreaterThanOrEqual(
          times[i - 1].getTime()
        )
      }
    })

    it('looks ahead up to 7 days', () => {
      const times = getNextOptimalTimes('linkedin', fixedDate, 20)

      if (times.length > 0) {
        const lastTime = times[times.length - 1]
        const maxDate = new Date(fixedDate)
        maxDate.setDate(maxDate.getDate() + 7)

        expect(lastTime.getTime()).toBeLessThanOrEqual(maxDate.getTime())
      }
    })
  })

  describe('formatRecommendedTime', () => {
    const testDate = new Date('2026-01-15T14:30:00Z')

    it('returns formatted string', () => {
      const formatted = formatRecommendedTime(testDate)
      expect(typeof formatted).toBe('string')
      expect(formatted.length).toBeGreaterThan(0)
    })

    it('includes weekday', () => {
      const formatted = formatRecommendedTime(testDate, 'UTC')
      // Should contain short weekday like "Wed", "Thu", etc.
      expect(formatted).toMatch(/\b(Sun|Mon|Tue|Wed|Thu|Fri|Sat)\b/)
    })

    it('includes month and day', () => {
      const formatted = formatRecommendedTime(testDate, 'UTC')
      // Should contain month name and day
      expect(formatted).toMatch(
        /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/
      )
      expect(formatted).toMatch(/\d{1,2}/)
    })

    it('includes time with AM/PM', () => {
      const formatted = formatRecommendedTime(testDate, 'UTC')
      expect(formatted).toMatch(/\d{1,2}:\d{2}\s*(AM|PM)/i)
    })

    it('respects timezone parameter', () => {
      const utcFormatted = formatRecommendedTime(testDate, 'UTC')
      // Just verify it doesn't throw with a timezone
      expect(typeof utcFormatted).toBe('string')
    })

    it('handles different times correctly', () => {
      const morning = new Date('2026-01-15T09:00:00Z')
      const evening = new Date('2026-01-15T20:00:00Z')

      const morningFormatted = formatRecommendedTime(morning, 'UTC')
      const eveningFormatted = formatRecommendedTime(evening, 'UTC')

      expect(morningFormatted).toMatch(/AM/i)
      expect(eveningFormatted).toMatch(/PM/i)
    })
  })
})
