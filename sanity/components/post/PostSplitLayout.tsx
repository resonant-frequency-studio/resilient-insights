'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { Box, Text } from '@sanity/ui'
import {
  ObjectInputProps,
  MemberField,
  FieldMember,
  ObjectMember,
} from 'sanity'

/**
 * Post Split Layout Component
 *
 * Renders a 2-column split layout:
 * - Left: Post form (all fields except distribution)
 * - Right: Distribution panel (sticky, scrollable)
 */

interface PostSplitLayoutProps {
  renderDefault: (props: ObjectInputProps) => React.ReactElement
  defaultProps: ObjectInputProps
  documentId: string // kept for potential future use
  schemaType: { name: string } // kept for potential future use
}

const DEFAULT_RIGHT_WIDTH = 440
const MIN_RIGHT_WIDTH = 360
const MAX_RIGHT_WIDTH = 760
const STORAGE_KEY = 'post-distribute-panel-width'

function isFieldMember(member: ObjectMember): member is FieldMember {
  return member.kind === 'field'
}

export function PostSplitLayout(props: PostSplitLayoutProps) {
  const { renderDefault, defaultProps } = props
  // documentId and schemaType available via props if needed

  // Find the distribution member from the document members
  // This member has the real form context and onChange handlers
  const distributionMember = useMemo(() => {
    if (!defaultProps.members || !Array.isArray(defaultProps.members)) {
      return null
    }
    return (
      defaultProps.members.find(
        (m): m is FieldMember => isFieldMember(m) && m.name === 'distribution'
      ) || null
    )
  }, [defaultProps.members])

  const [rightWidth, setRightWidth] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? parseInt(stored, 10) : DEFAULT_RIGHT_WIDTH
    }
    return DEFAULT_RIGHT_WIDTH
  })
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Inject global CSS to override Sanity Container max-width
  useEffect(() => {
    const styleId = 'post-split-layout-container-override'
    let styleElement = document.getElementById(styleId) as HTMLStyleElement

    if (!styleElement) {
      styleElement = document.createElement('style')
      styleElement.id = styleId
      document.head.appendChild(styleElement)
    }

    styleElement.textContent = `
      /* Override Sanity Container max-width for split layout */
      [data-ui="Container"],
      .StyledContainer-sc-wyroop-0,
      [data-testid="document-panel-scroller"] [data-ui="Container"],
      [data-testid="document-panel-scroller"] .StyledContainer-sc-wyroop-0,
      [data-testid="document-panel-scroller"] > div > div[data-ui="Container"],
      [data-testid="document-panel-scroller"] > div > div.StyledContainer-sc-wyroop-0 {
        max-width: none !important;
        width: 100% !important;
      }
      .pt-editable>.pt-block {
        max-width: 100% !important;
      }
    `

    return () => {
      // Clean up on unmount
      const element = document.getElementById(styleId)
      if (element) {
        element.remove()
      }
    }
  }, [])

  // Persist width preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, String(rightWidth))
    }
  }, [rightWidth])

  // Handle drag for resize
  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return

      const containerRect = containerRef.current.getBoundingClientRect()
      // Calculate width from right edge of container to mouse position
      const newWidth = containerRect.right - e.clientX

      // Clamp between min and max
      const clampedWidth = Math.max(
        MIN_RIGHT_WIDTH,
        Math.min(MAX_RIGHT_WIDTH, newWidth)
      )
      setRightWidth(clampedWidth)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    // Prevent text selection while dragging
    const handleSelectStart = (e: Event) => {
      e.preventDefault()
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('selectstart', handleSelectStart)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('selectstart', handleSelectStart)
    }
  }, [isDragging])

  return (
    <Box
      ref={containerRef}
      style={{
        display: 'grid',
        gridTemplateColumns: `1fr 4px ${rightWidth}px`, // Flexible left, fixed resize handle, fixed right
        height: '100%',
        width: '100%',
        maxWidth: '100%',
        overflow: 'hidden',
        position: 'relative',
        // Ensure we break out of any parent constraints
        margin: 0,
        padding: 0,
      }}
    >
      {/* Left: Post form (distribution filtered out - shown in right panel instead) */}
      <Box
        style={{
          overflowY: 'auto',
          paddingRight: '12px',
          minWidth: 0, // Allow grid to shrink below content size
          backgroundColor: 'var(--card-bg-color)',
        }}
      >
        {renderDefault({
          ...defaultProps,
          members: Array.isArray(defaultProps.members)
            ? defaultProps.members.filter(
                member =>
                  !(member.kind === 'field' && member.name === 'distribution')
              )
            : defaultProps.members,
        })}
      </Box>

      {/* Resize handle */}
      <Box
        onMouseDown={e => {
          e.preventDefault()
          setIsDragging(true)
        }}
        style={{
          cursor: 'col-resize',
          backgroundColor: 'var(--card-border-color)',
          position: 'relative',
          width: '4px',
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
      >
        <Box
          style={{
            position: 'absolute',
            top: 0,
            left: '-4px',
            right: '-4px',
            bottom: 0,
            cursor: 'col-resize',
            zIndex: 10,
          }}
        />
      </Box>

      {/* Right: Distribution panel using actual form member */}
      <Box
        style={{
          // borderLeft: '2px solid var(--card-border-color)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--card-bg-color)',
          minWidth: 0,
        }}
      >
        <Box
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            width: '100%',
          }}
        >
          {distributionMember ? (
            <MemberField
              member={distributionMember}
              renderAnnotation={defaultProps.renderAnnotation}
              renderBlock={defaultProps.renderBlock}
              renderField={defaultProps.renderField}
              renderInlineBlock={defaultProps.renderInlineBlock}
              renderInput={defaultProps.renderInput}
              renderItem={defaultProps.renderItem}
              renderPreview={defaultProps.renderPreview}
            />
          ) : (
            <>
              <Text size={1} weight="bold" style={{ marginBottom: '16px' }}>
                Distribution
              </Text>
              <Text size={1} muted>
                Distribution field not found in document members.
              </Text>
            </>
          )}
        </Box>
      </Box>
    </Box>
  )
}

export default PostSplitLayout
