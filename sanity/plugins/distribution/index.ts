import { definePlugin } from 'sanity'
import { distributionAction } from './distributionAction'

/**
 * Distribution plugin for Sanity Studio
 * Registers document action for generating distribution content
 */
export const distributionPlugin = definePlugin({
  name: 'distribution',
  document: {
    actions: (prev, context) => {
      // Only add action for post documents
      if (context.schemaType === 'post') {
        return [...prev, distributionAction as (typeof prev)[0]]
      }
      return prev
    },
  },
})
