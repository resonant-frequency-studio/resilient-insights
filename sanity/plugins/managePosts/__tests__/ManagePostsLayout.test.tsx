import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { ThemeProvider, studioTheme } from '@sanity/ui'
import { ManagePostsLayout } from '../ManagePostsLayout'

const mockFetch = jest.fn()
const mockCreate = jest.fn()
const mockClient = { fetch: mockFetch, create: mockCreate }
const mockUseDocumentForm = jest.fn()
const mockUseFormBuilder = jest.fn()

jest.mock('sanity', () => ({
  createPatchChannel: jest.fn(() => ({})),
  useClient: () => mockClient,
  useDocumentForm: (...args: unknown[]) => mockUseDocumentForm(...args),
  useFormBuilder: () => mockUseFormBuilder(),
  FormProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  ObjectInputMembers: () => <div>DistributionFields</div>,
}))

jest.mock('sanity/_singletons', () => ({
  CopyPasteContext: React.createContext(null),
  DocumentFieldActionsContext: React.createContext(null),
  GetFormValueContext: React.createContext(null),
  FormValueContext: React.createContext(null),
}))

jest.mock('@sanity/image-url', () => {
  return () => ({
    image: () => ({
      width: () => ({
        url: () => 'https://example.com/image.jpg',
      }),
    }),
  })
})

describe('ManagePostsLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCreate.mockResolvedValue({ _id: 'dist-1' })
  })

  it('renders loading state', () => {
    render(
      <ThemeProvider theme={studioTheme}>
        <ManagePostsLayout post={null} loading />
      </ThemeProvider>
    )

    expect(screen.getByText('Loading post details...')).toBeInTheDocument()
  })

  it('renders empty state when no post selected', () => {
    render(
      <ThemeProvider theme={studioTheme}>
        <ManagePostsLayout post={null} loading={false} />
      </ThemeProvider>
    )

    expect(
      screen.getByText('Select a post to manage distribution content.')
    ).toBeInTheDocument()
  })

  it('renders preview and distribution panel', async () => {
    mockUseDocumentForm.mockReturnValue({
      formState: {
        members: [{ kind: 'field', name: 'distribution', field: {} }],
        presence: [],
        validation: [],
        focusPath: [],
        focused: false,
        groups: [],
      },
      ready: true,
      value: {
        _id: 'post-1',
        title: 'Test Post',
        slug: { current: 'test-post' },
        excerpt: 'Short excerpt',
        body: [{ _type: 'block', children: [{ text: 'Body content' }] }],
      },
      schemaType: { name: 'post' },
      onChange: jest.fn(),
      onFocus: jest.fn(),
      onBlur: jest.fn(),
      onPathOpen: jest.fn(),
      onSetActiveFieldGroup: jest.fn(),
      onSetCollapsedFieldSet: jest.fn(),
      onSetCollapsedPath: jest.fn(),
      collapsedFieldSets: undefined,
      collapsedPaths: undefined,
    })

    mockUseFormBuilder.mockReturnValue({
      renderInput: jest.fn(),
      renderField: jest.fn(),
      renderItem: jest.fn(),
      renderPreview: jest.fn(),
      renderBlock: jest.fn(),
      renderInlineBlock: jest.fn(),
      renderAnnotation: jest.fn(),
    })

    mockFetch.mockImplementation((query: string) => {
      if (query.includes('_type == "postDistribution"')) {
        return Promise.resolve({ _id: 'dist-1' })
      }
      if (query.includes('author->{name}')) {
        return Promise.resolve({
          author: { name: 'Jane Doe' },
          categories: [{ title: 'Leadership' }],
        })
      }
      return Promise.resolve({
        _id: 'post-1',
        title: 'Test Post',
        slug: { current: 'test-post' },
      })
    })

    render(
      <ThemeProvider theme={studioTheme}>
        <ManagePostsLayout post={{ _id: 'post-1' }} loading={false} />
      </ThemeProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Test Post')).toBeInTheDocument()
      expect(screen.getByText('DistributionFields')).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(screen.getByText('Jane Doe')).toBeInTheDocument()
      expect(screen.getByText('Leadership')).toBeInTheDocument()
    })
  })

  it('shows missing distribution field state', async () => {
    mockUseDocumentForm.mockReturnValue({
      formState: {
        members: [],
        presence: [],
        validation: [],
        focusPath: [],
        focused: false,
        groups: [],
      },
      ready: true,
      value: { _id: 'post-1', title: 'Test Post' },
      schemaType: { name: 'post' },
      onChange: jest.fn(),
      onFocus: jest.fn(),
      onBlur: jest.fn(),
      onPathOpen: jest.fn(),
      onSetActiveFieldGroup: jest.fn(),
      onSetCollapsedFieldSet: jest.fn(),
      onSetCollapsedPath: jest.fn(),
      collapsedFieldSets: undefined,
      collapsedPaths: undefined,
    })

    mockUseFormBuilder.mockReturnValue({
      renderInput: jest.fn(),
      renderField: jest.fn(),
      renderItem: jest.fn(),
      renderPreview: jest.fn(),
      renderBlock: jest.fn(),
      renderInlineBlock: jest.fn(),
      renderAnnotation: jest.fn(),
    })

    mockFetch.mockImplementation((query: string) => {
      if (query.includes('_type == "postDistribution"')) {
        return Promise.resolve({ _id: 'dist-1' })
      }
      if (query.includes('author->{name}')) {
        return Promise.resolve({})
      }
      return Promise.resolve({ _id: 'post-1', title: 'Test Post' })
    })

    render(
      <ThemeProvider theme={studioTheme}>
        <ManagePostsLayout post={{ _id: 'post-1' }} loading={false} />
      </ThemeProvider>
    )

    await waitFor(() => {
      expect(
        screen.getByText('No distribution fields found.')
      ).toBeInTheDocument()
    })
  })
})
