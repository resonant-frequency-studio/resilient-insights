import { Inngest } from 'inngest'

/**
 * Inngest client for workflow orchestration
 * Used for scheduling and executing background jobs
 */
export const inngest = new Inngest({
  id: 'resilient-insights-scheduler',
  eventKey: process.env.INNGEST_EVENT_KEY,
})
