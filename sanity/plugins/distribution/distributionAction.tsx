'use client'

import { DocumentActionComponent, DocumentActionProps } from 'sanity'
import { generateAndSchedule } from './actions'

/**
 * Sanity Studio Document Action
 * Shows "Generate distribution content" button in document actions
 *
 * Note: This is a simplified implementation that generates for all channels.
 * For channel selection, users can use the Distribution field UI or we can
 * enhance this action later with a proper dialog.
 */
export const distributionAction: DocumentActionComponent = (
  props: DocumentActionProps
) => {
  const { id, published } = props

  // Only show for published posts
  if (published === null) {
    return null
  }

  return {
    label: 'Generate distribution content',
    icon: () => null, // You can add an icon here if desired
    onHandle: async () => {
      // Generate for all channels by default
      // Users can view and edit results in the Distribution field
      const channels: ('linkedin' | 'facebook' | 'instagram')[] = [
        'linkedin',
        'facebook',
        'instagram',
      ]

      try {
        const result = await generateAndSchedule(id, channels)
        if (result.success) {
          // Show success - Sanity will handle the toast
          // Refresh the document to show updated content
          window.location.reload()
        } else {
          alert(`Generation failed: ${result.error || 'Unknown error'}`)
        }
      } catch (error) {
        alert(
          `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      }
    },
  }
}
