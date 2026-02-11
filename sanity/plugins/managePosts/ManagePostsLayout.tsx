'use client'

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import {
  Box,
  Card,
  Heading,
  Stack,
  Text,
  Spinner,
  Flex,
  Menu,
  MenuButton,
  MenuItem,
  Button,
} from '@sanity/ui'
import { EllipsisVerticalIcon } from '@sanity/icons'
import {
  createPatchChannel,
  FormProvider,
  ObjectInputMembers,
  useClient,
  useDocumentForm,
  useFormBuilder,
} from 'sanity'
import {
  CopyPasteContext,
  DocumentFieldActionsContext,
  GetFormValueContext,
  FormValueContext,
} from 'sanity/_singletons'
import imageUrlBuilder from '@sanity/image-url'
import type { ObjectMember, Path, SanityDocumentLike } from 'sanity'
import type { SanityImageSource } from '@sanity/image-url/lib/types/types'
import {
  connectLinkedIn,
  disconnectLinkedIn,
  connectFacebook,
  disconnectFacebook,
} from '../distribution/actions'

interface PostDocument {
  _id: string
  title?: string
  slug?: { current?: string }
  excerpt?: string
  body?: unknown
  mainImage?: unknown
  author?: { name?: string }
  categories?: Array<{ title?: string }>
}

interface SocialAccountsState {
  linkedin?: {
    accessToken?: string
    connectedAt?: string
  }
  facebook?: {
    accessToken?: string
    connectedAt?: string
  }
  instagram?: {
    accessToken?: string
    connectedAt?: string
  }
}

interface ManagePostsLayoutProps {
  post: PostDocument | null
  loading?: boolean
}

export function ManagePostsLayout({
  post,
  loading = false,
}: ManagePostsLayoutProps) {
  const client = useClient({ apiVersion: '2024-01-01' })
  const [distributionDocId, setDistributionDocId] = useState<string | null>(
    null
  )
  const [isLoadingDistribution, setIsLoadingDistribution] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Find or create postDistribution document for the selected post
  useEffect(() => {
    if (!post?._id) {
      setDistributionDocId(null)
      return
    }

    const findOrCreateDistribution = async () => {
      setIsLoadingDistribution(true)
      setError(null)

      try {
        // Get the post ID without drafts prefix for consistent reference
        const postId = post._id.replace(/^drafts\./, '')

        // Check if a postDistribution document already exists for this post
        const existing = await client.fetch<{ _id: string } | null>(
          `*[_type == "postDistribution" && post._ref == $postId][0]{_id}`,
          { postId }
        )

        if (existing) {
          setDistributionDocId(existing._id)
        } else {
          // Create a new postDistribution document
          const newDoc = await client.create({
            _type: 'postDistribution',
            post: {
              _type: 'reference',
              _ref: postId,
            },
          })
          setDistributionDocId(newDoc._id)
        }
      } catch (err) {
        console.error('Error finding/creating distribution document:', err)
        setError('Failed to load distribution settings')
      } finally {
        setIsLoadingDistribution(false)
      }
    }

    findOrCreateDistribution()
  }, [client, post?._id])

  if (loading) {
    return (
      <Card padding={3} radius={2} border>
        <Text size={1} muted>
          Loading post details...
        </Text>
      </Card>
    )
  }

  if (!post) {
    return (
      <Card padding={3} radius={2} border>
        <Text size={1} muted>
          Select a post to manage distribution content.
        </Text>
      </Card>
    )
  }

  if (isLoadingDistribution) {
    return (
      <Card padding={4} radius={2} border>
        <Stack space={3}>
          <Spinner muted />
          <Text size={1} muted>
            Loading distribution settings...
          </Text>
        </Stack>
      </Card>
    )
  }

  if (error) {
    return (
      <Card padding={3} radius={2} border tone="critical">
        <Text size={1}>{error}</Text>
      </Card>
    )
  }

  if (!distributionDocId) {
    return (
      <Card padding={3} radius={2} border>
        <Text size={1} muted>
          Preparing distribution document...
        </Text>
      </Card>
    )
  }

  return (
    <ManagePostsForm postId={post._id} distributionDocId={distributionDocId} />
  )
}

// Helper to get a value at a path from a document
function getValueAtPath(doc: SanityDocumentLike | null, path: Path): unknown {
  if (!doc || !path || path.length === 0) return doc
  let current: unknown = doc
  for (const segment of path) {
    if (current === null || current === undefined) return undefined
    if (typeof segment === 'string' || typeof segment === 'number') {
      current = (current as Record<string, unknown>)[segment]
    } else if ('_key' in segment) {
      if (Array.isArray(current)) {
        current = current.find(
          (item: { _key?: string }) => item?._key === segment._key
        )
      } else {
        return undefined
      }
    } else {
      return undefined
    }
  }
  return current
}

// Resizable panel constants
const DEFAULT_RIGHT_WIDTH = 500
const MIN_RIGHT_WIDTH = 300
const MAX_RIGHT_WIDTH = 900
const STORAGE_KEY = 'manage-posts-panel-width'

function ManagePostsForm({
  postId,
  distributionDocId,
}: {
  postId: string
  distributionDocId: string
}) {
  const client = useClient({ apiVersion: '2024-01-01' })
  const [patchChannel] = useState(createPatchChannel)
  const containerRef = useRef<HTMLDivElement>(null)
  const [postData, setPostData] = useState<SanityDocumentLike | null>(null)

  // Fetch post data for preview
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const docId = postId.replace(/^drafts\./, '')
        const result = await client.fetch<SanityDocumentLike>(
          `*[_type == "post" && (_id == $id || _id == "drafts." + $id)][0]`,
          { id: docId }
        )
        setPostData(result)
      } catch {
        // Silently fail - preview will show without post data
      }
    }
    fetchPost()
  }, [client, postId])

  // Resizable panel state
  const [rightWidth, setRightWidth] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? parseInt(stored, 10) : DEFAULT_RIGHT_WIDTH
    }
    return DEFAULT_RIGHT_WIDTH
  })
  const [isDragging, setIsDragging] = useState(false)

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

  // Provide empty field actions context to satisfy field components
  const fieldActionsValue = useMemo(() => ({ actions: [] }), [])

  // Provide no-op copy/paste context to satisfy field components
  const copyPasteValue = useMemo(
    () => ({
      setDocumentMeta: () => {},
      onCopy: async () => {},
      onPaste: async () => {},
    }),
    []
  )

  // Use document form for the postDistribution document
  const {
    formState,
    ready,
    value,
    schemaType,
    onChange,
    onFocus,
    onBlur,
    onPathOpen,
    onSetActiveFieldGroup,
    onSetCollapsedFieldSet,
    onSetCollapsedPath,
    collapsedFieldSets,
    collapsedPaths,
  } = useDocumentForm({
    documentId: distributionDocId,
    documentType: 'postDistribution',
  })

  // Create a stable getFormValue function
  const getFormValue = useCallback(
    (path: Path) => getValueAtPath(value, path),
    [value]
  )

  // FormValueContext expects { value: ... } wrapper
  const formValueContextValue = useMemo(() => ({ value }), [value])

  const members = formState?.members || []
  const isSaving = Boolean(
    (formState as { isSaving?: boolean; isSubmitting?: boolean })?.isSaving ||
    (formState as { isSubmitting?: boolean })?.isSubmitting
  )

  // Filter out the 'post' reference field - we don't want to show that in the form
  const distributionMembers = members.filter(
    member => member.kind === 'field' && member.name !== 'post'
  )

  if (!ready || !formState) {
    return (
      <Card padding={3} radius={2} border>
        <Text size={1} muted>
          Loading distribution editor...
        </Text>
      </Card>
    )
  }

  return (
    <CopyPasteContext.Provider value={copyPasteValue}>
      <DocumentFieldActionsContext.Provider value={fieldActionsValue}>
        <GetFormValueContext.Provider value={getFormValue}>
          <FormValueContext.Provider value={formValueContextValue}>
            <FormProvider
              __internal_patchChannel={patchChannel}
              id={distributionDocId}
              schemaType={schemaType}
              presence={formState.presence}
              validation={formState.validation}
              focusPath={formState.focusPath}
              focused={formState.focused}
              groups={formState.groups}
              collapsedFieldSets={collapsedFieldSets}
              collapsedPaths={collapsedPaths}
              onChange={onChange}
              onPathBlur={onBlur}
              onPathFocus={onFocus}
              onPathOpen={onPathOpen}
              onFieldGroupSelect={onSetActiveFieldGroup}
              onSetFieldSetCollapsed={onSetCollapsedFieldSet}
              onSetPathCollapsed={onSetCollapsedPath}
            >
              <Flex direction="column" style={{ height: '100%', minHeight: 0 }}>
                {isSaving && (
                  <Card padding={2} radius={2} tone="primary">
                    <Text size={1}>Saving updates...</Text>
                  </Card>
                )}
                <Box
                  ref={containerRef}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `1fr 4px ${rightWidth}px`,
                    height: '100%',
                    width: '100%',
                    overflow: 'hidden',
                    position: 'relative',
                    minHeight: 0,
                    flex: 1,
                  }}
                >
                  {/* Left side: Simple read-only preview */}
                  <Box
                    style={{
                      overflowY: 'auto',
                      paddingRight: '8px',
                      minWidth: 0,
                      height: '100%',
                    }}
                  >
                    <PostPreviewPanel value={postData} />
                  </Box>

                  {/* Resize handle */}
                  <Box
                    onMouseDown={e => {
                      e.preventDefault()
                      setIsDragging(true)
                    }}
                    style={{
                      cursor: 'col-resize',
                      backgroundColor: isDragging
                        ? 'var(--card-focus-ring-color)'
                        : 'var(--card-border-color)',
                      position: 'relative',
                      width: '4px',
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                      transition: 'background-color 0.15s',
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

                  {/* Right side: Distribution form */}
                  <Box
                    style={{
                      overflowY: 'auto',
                      paddingLeft: '8px',
                      minWidth: 0,
                      height: '100%',
                    }}
                  >
                    <DistributionFormPanel
                      members={distributionMembers}
                      postId={postId}
                      socialAccounts={
                        (value as { socialAccounts?: SocialAccountsState })
                          ?.socialAccounts
                      }
                    />
                  </Box>
                </Box>
              </Flex>
            </FormProvider>
          </FormValueContext.Provider>
        </GetFormValueContext.Provider>
      </DocumentFieldActionsContext.Provider>
    </CopyPasteContext.Provider>
  )
}

// Helper to extract plain text from Portable Text
function portableTextToPlainText(
  blocks: Array<{
    _type: string
    children?: Array<{ text?: string }>
    text?: string
  }>
): string {
  if (!blocks || !Array.isArray(blocks)) return ''

  return blocks
    .map(block => {
      if (block._type !== 'block' || !block.children) {
        return ''
      }
      return block.children.map(child => child.text || '').join('')
    })
    .filter(Boolean)
    .join('\n\n')
}

// Simple read-only preview of post content (no form inputs)
interface ResolvedPostData {
  authorName: string
  categoryTitles: string[]
}

function PostPreviewPanel({ value }: { value: SanityDocumentLike | null }) {
  const client = useClient({ apiVersion: '2024-01-01' })
  const builder = imageUrlBuilder(client)
  const [resolvedData, setResolvedData] = useState<ResolvedPostData>({
    authorName: '',
    categoryTitles: [],
  })

  // Fetch resolved author and categories
  useEffect(() => {
    if (!value?._id) return

    const fetchResolved = async () => {
      try {
        // Get the document ID without drafts prefix
        const docId = (value._id as string).replace(/^drafts\./, '')
        const result = await client.fetch<{
          author?: { name?: string }
          categories?: Array<{ title?: string }>
        }>(
          `*[_type == "post" && (_id == $id || _id == "drafts." + $id)][0]{
            author->{name},
            categories[]->{title}
          }`,
          { id: docId }
        )
        setResolvedData({
          authorName: result?.author?.name || '',
          categoryTitles:
            result?.categories
              ?.map(c => c.title)
              .filter((t): t is string => Boolean(t)) || [],
        })
      } catch {
        // Silently fail - preview will show without author/categories
      }
    }

    fetchResolved()
  }, [client, value?._id])

  if (!value) {
    return (
      <Card padding={3} radius={2} border>
        <Text size={1} muted>
          Loading post preview...
        </Text>
      </Card>
    )
  }

  const title = (value.title as string) || 'Untitled'
  const slug = (value.slug as { current?: string })?.current || ''
  const excerpt = (value.excerpt as string) || ''
  const mainImage = value.mainImage as SanityImageSource | undefined
  const body = value.body as
    | Array<{ _type: string; children?: Array<{ text?: string }> }>
    | undefined

  // Build image URL if mainImage exists
  const imageUrl = mainImage ? builder.image(mainImage).width(600).url() : null

  // Extract plain text from body (full content, no truncation)
  const bodyText = body ? portableTextToPlainText(body) : ''

  return (
    <Card padding={4} radius={2} border tone="default">
      <Stack space={4}>
        <Heading as="h2" size={2}>
          {title}
        </Heading>

        {slug && (
          <Text size={1} muted>
            /{slug}
          </Text>
        )}

        {imageUrl && (
          <Box>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={title}
              style={{
                width: '100%',
                height: 'auto',
                borderRadius: '4px',
                maxHeight: '300px',
                objectFit: 'cover',
              }}
            />
          </Box>
        )}

        <Box
          style={{
            display: 'flex',
            gap: '32px',
            flexWrap: 'wrap',
          }}
        >
          {resolvedData.authorName && (
            <Stack space={2}>
              <Text size={1} weight="semibold">
                Author
              </Text>
              <Text size={1}>{resolvedData.authorName}</Text>
            </Stack>
          )}

          {resolvedData.categoryTitles.length > 0 && (
            <Stack space={2}>
              <Text size={1} weight="semibold">
                Categories
              </Text>
              <Text size={1}>{resolvedData.categoryTitles.join(', ')}</Text>
            </Stack>
          )}
        </Box>

        {excerpt && (
          <Stack space={2}>
            <Text size={1} weight="semibold">
              Excerpt
            </Text>
            <Text size={1} style={{ whiteSpace: 'pre-wrap' }}>
              {excerpt}
            </Text>
          </Stack>
        )}

        {bodyText && (
          <Stack space={2}>
            <Text size={1} weight="semibold">
              Content
            </Text>
            <Text
              size={1}
              style={{
                whiteSpace: 'pre-wrap',
                lineHeight: 1.6,
              }}
            >
              {bodyText}
            </Text>
          </Stack>
        )}

        <Card padding={3} radius={2} tone="transparent" border>
          <Text size={1} muted>
            Read-only preview. Edit the post using the main document editor.
          </Text>
        </Card>
      </Stack>
    </Card>
  )
}

// Distribution form panel using actual Sanity form inputs
interface DistributionFormPanelProps {
  members: ObjectMember[]
  postId: string
  socialAccounts?: SocialAccountsState
}

function DistributionFormPanel({
  members,
  postId,
  socialAccounts,
}: DistributionFormPanelProps) {
  const formBuilder = useFormBuilder()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const isLinkedInConnected = Boolean(socialAccounts?.linkedin?.accessToken)
  const isMetaConnected =
    Boolean(socialAccounts?.facebook?.accessToken) ||
    Boolean(socialAccounts?.instagram?.accessToken)

  const handleConnectLinkedIn = async () => {
    setLoading('linkedin')
    setError(null)
    const result = await connectLinkedIn(postId)
    if (result.success && result.authUrl) {
      window.location.href = result.authUrl
    } else {
      setError(result.error || 'Failed to connect LinkedIn')
      setLoading(null)
    }
  }

  const handleDisconnectLinkedIn = async () => {
    setLoading('linkedin')
    setError(null)
    const result = await disconnectLinkedIn(postId)
    if (!result.success) {
      setError(result.error || 'Failed to disconnect LinkedIn')
    }
    setLoading(null)
  }

  const handleConnectMeta = async () => {
    setLoading('meta')
    setError(null)
    const result = await connectFacebook(postId)
    if (result.success && result.authUrl) {
      window.location.href = result.authUrl
    } else {
      setError(result.error || 'Failed to connect Meta')
      setLoading(null)
    }
  }

  const handleDisconnectMeta = async () => {
    setLoading('meta')
    setError(null)
    const result = await disconnectFacebook(postId)
    if (!result.success) {
      setError(result.error || 'Failed to disconnect Meta')
    }
    setLoading(null)
  }

  if (!formBuilder?.renderInput) {
    return (
      <Card padding={3} radius={2} tone="transparent" border>
        <Text size={1} muted>
          Form context not available.
        </Text>
      </Card>
    )
  }

  if (members.length === 0) {
    return (
      <Card padding={3} radius={2} border>
        <Text size={1} muted>
          No distribution fields found.
        </Text>
      </Card>
    )
  }

  return (
    <Stack space={4}>
      {/* Header with menu */}
      <Flex justify="space-between" align="center">
        <Text size={2} weight="semibold">
          Distribution
        </Text>
        <MenuButton
          button={
            <Button
              icon={EllipsisVerticalIcon}
              mode="bleed"
              padding={2}
              disabled={loading !== null}
            />
          }
          id="distribution-menu"
          menu={
            <Menu>
              {isLinkedInConnected ? (
                <MenuItem
                  text="Disconnect LinkedIn"
                  onClick={handleDisconnectLinkedIn}
                  disabled={loading === 'linkedin'}
                />
              ) : (
                <MenuItem
                  text="Connect LinkedIn"
                  onClick={handleConnectLinkedIn}
                  disabled={loading === 'linkedin'}
                />
              )}
              {isMetaConnected ? (
                <MenuItem
                  text="Disconnect Meta"
                  onClick={handleDisconnectMeta}
                  disabled={loading === 'meta'}
                />
              ) : (
                <MenuItem
                  text="Connect Meta"
                  onClick={handleConnectMeta}
                  disabled={loading === 'meta'}
                />
              )}
            </Menu>
          }
          popover={{ portal: true }}
        />
      </Flex>

      {error && (
        <Card padding={2} radius={2} tone="critical">
          <Text size={1}>{error}</Text>
        </Card>
      )}

      <ObjectInputMembers
        members={members}
        renderInput={formBuilder.renderInput}
        renderField={formBuilder.renderField}
        renderItem={formBuilder.renderItem}
        renderPreview={formBuilder.renderPreview}
        renderBlock={formBuilder.renderBlock}
        renderInlineBlock={formBuilder.renderInlineBlock}
        renderAnnotation={formBuilder.renderAnnotation}
      />
    </Stack>
  )
}
