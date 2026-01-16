'use client'

import { useState, useEffect } from 'react'
import { Flex, Button, Box } from '@sanity/ui'
import { useFormValue, ObjectInputProps } from 'sanity'
import { PostSplitLayout } from './PostSplitLayout'

/**
 * Post Editor Modes Component
 *
 * Provides Edit/Distribute mode switching for post documents.
 * Uses URL query param to persist mode: ?view=edit or ?view=distribute
 *
 * This component receives ObjectInputProps from the document type's components.input
 * and wraps the default form rendering with mode switching.
 */

type EditorMode = 'edit' | 'distribute'

export function PostEditorModes(props: ObjectInputProps) {
  const { renderDefault, schemaType } = props

  // Get documentId from form context
  const documentId = useFormValue(['_id']) as string | undefined

  // Get mode from URL query param, default to 'edit'
  const [mode, setMode] = useState<EditorMode>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const view = params.get('view')
      return (view === 'distribute' ? 'distribute' : 'edit') as EditorMode
    }
    return 'edit'
  })

  // Inject global CSS to override Sanity Container max-width
  useEffect(() => {
    const styleId = 'post-editor-container-override'
    let styleElement = document.getElementById(styleId) as HTMLStyleElement

    if (!styleElement) {
      styleElement = document.createElement('style')
      styleElement.id = styleId
      document.head.appendChild(styleElement)
    }

    styleElement.textContent = `
      /* Override Sanity Container max-width for post editor */
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

  // Update URL when mode changes (without reload)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      if (mode === 'distribute') {
        url.searchParams.set('view', 'distribute')
      } else {
        url.searchParams.delete('view')
      }
      // Use replaceState to avoid reload
      window.history.replaceState(
        { ...window.history.state, view: mode },
        '',
        url.toString()
      )
    }
  }, [mode])

  // Render mode switcher buttons
  const renderModeSwitcher = () => (
    <Flex
      gap={2}
      padding={3}
      style={{
        borderBottom: '1px solid var(--card-border-color)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        backgroundColor: 'var(--card-bg-color)',
      }}
    >
      <Button
        mode={mode === 'edit' ? 'default' : 'ghost'}
        tone={mode === 'edit' ? 'primary' : 'default'}
        text="Edit"
        onClick={() => {
          setMode('edit')
        }}
      />
      <Button
        mode={mode === 'distribute' ? 'default' : 'ghost'}
        tone={mode === 'distribute' ? 'primary' : 'default'}
        text="Distribute"
        onClick={() => {
          setMode('distribute')
        }}
      />
    </Flex>
  )

  // Edit mode: single column form (post editor only, no distribution)
  if (mode === 'edit') {
    const filteredProps = {
      ...props,
      members: Array.isArray(props.members)
        ? props.members.filter(
            member =>
              !(member.kind === 'field' && member.name === 'distribution')
          )
        : props.members,
    }

    return (
      <Box
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
        }}
      >
        {renderModeSwitcher()}
        <Box
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
          }}
        >
          {renderDefault(filteredProps as ObjectInputProps)}
        </Box>
      </Box>
    )
  }

  // Distribute mode: split layout
  if (!documentId) {
    // Fallback if documentId not available
    return (
      <Box style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {renderModeSwitcher()}
        <Box flex={1} style={{ overflowY: 'auto' }}>
          {renderDefault(props)}
        </Box>
      </Box>
    )
  }

  return (
    <Box
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0, // Allow flex child to shrink
        position: 'relative',
      }}
    >
      {renderModeSwitcher()}
      <Box
        style={{
          flex: 1,
          minHeight: 0, // Critical for grid to work inside flex
          overflow: 'hidden',
          width: '100%',
        }}
      >
        <PostSplitLayout
          renderDefault={renderDefault}
          defaultProps={props}
          documentId={documentId}
          schemaType={schemaType}
        />
      </Box>
    </Box>
  )
}

export default PostEditorModes
