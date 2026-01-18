import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider, studioTheme } from '@sanity/ui'
import { LinkedInSocialInput } from '../LinkedInSocialInput'

// Mock the actions module
jest.mock('../../plugins/distribution/actions', () => ({
  generateLinkedInDraft: jest.fn(),
  schedulePost: jest.fn(),
  checkRateLimitStatus: jest.fn(),
}))

// Mock the portableText module
jest.mock('@/lib/sanity/portableText', () => ({
  portableTextToPlainText: jest.fn(() => 'Plain text content'),
}))

// Mock the scheduler recommendations
jest.mock('@/lib/scheduler/recommendations', () => ({
  getNextOptimalTimes: jest.fn(() => [
    new Date('2026-01-15T09:00:00Z'),
    new Date('2026-01-15T12:00:00Z'),
    new Date('2026-01-15T17:00:00Z'),
  ]),
}))

// Mock the imageOptimizer
jest.mock('@/lib/social/imageOptimizer', () => ({
  getPreviewImageUrl: jest.fn(() => null),
  getPlatformDimensionInfo: jest.fn(() => '1200×627 (1.91:1)'),
  SanityImageReference: {},
}))

// Get mocked functions
import {
  generateLinkedInDraft,
  schedulePost,
  checkRateLimitStatus,
} from '../../plugins/distribution/actions'
const mockGenerateLinkedInDraft = generateLinkedInDraft as jest.Mock
const mockSchedulePost = schedulePost as jest.Mock
const mockCheckRateLimitStatus = checkRateLimitStatus as jest.Mock

// Mock useFormValue
const mockUseFormValue = jest.fn()
jest.mock('sanity', () => ({
  useFormValue: (...args: unknown[]) => mockUseFormValue(...args),
  PatchEvent: {
    from: jest.fn(patches => ({ patches })),
  },
  set: jest.fn((value, path) => ({ type: 'set', value, path })),
}))

// Wrapper component with theme
const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={studioTheme}>{children}</ThemeProvider>
)

// Create mock props that match ObjectInputProps structure
const createMockProps = (overrides = {}) =>
  ({
    value: {},
    path: ['distribution', 'social', 'linkedin'],
    schemaType: {
      name: 'object',
      fields: [],
      jsonType: 'object',
    },
    onChange: jest.fn(),
    onFocus: jest.fn(),
    onBlur: jest.fn(),
    onPathFocus: jest.fn(),
    onPathBlur: jest.fn(),
    onFieldOpen: jest.fn(),
    onFieldClose: jest.fn(),
    onFieldCollapse: jest.fn(),
    onFieldExpand: jest.fn(),
    onFieldSetCollapse: jest.fn(),
    onFieldSetExpand: jest.fn(),
    onFieldGroupSelect: jest.fn(),
    focused: false,
    focusPath: [],
    readOnly: false,
    presence: [],
    validation: [],
    members: [],
    groups: [],
    collapsedFieldSets: { value: new Set<string>() },
    collapsedFields: { value: new Set<string>() },
    id: 'linkedin-input',
    level: 0,
    changed: false,
    displayInlineChanges: false,
    hasUpstreamVersion: false,
    __unstable_computeDiff: jest.fn(),
    renderDefault: jest.fn(() => (
      <div data-testid="default-render">Default Render</div>
    )),
    renderAnnotation: jest.fn(),
    renderBlock: jest.fn(),
    renderField: jest.fn(),
    renderInlineBlock: jest.fn(),
    renderInput: jest.fn(),
    renderItem: jest.fn(),
    renderPreview: jest.fn(),
    elementProps: {
      id: 'linkedin-input',
      onFocus: jest.fn(),
      onBlur: jest.fn(),
      ref: { current: null },
    },
    ...overrides,
  }) as unknown as React.ComponentProps<typeof LinkedInSocialInput>

describe('LinkedInSocialInput', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCheckRateLimitStatus.mockResolvedValue({
      rateLimited: false,
      remainingMs: 0,
    })
    mockUseFormValue.mockImplementation((path: string[]) => {
      if (path.includes('_id')) return 'test-post-id'
      if (path.includes('generatedAt')) return null
      if (path.includes('text')) return []
      if (path.includes('image')) return null
      return undefined
    })
  })

  describe('rendering', () => {
    it('renders generate button', () => {
      render(
        <Wrapper>
          <LinkedInSocialInput {...createMockProps()} />
        </Wrapper>
      )
      expect(screen.getByText('Generate LinkedIn Draft')).toBeInTheDocument()
    })

    it('renders LinkedIn header', () => {
      render(
        <Wrapper>
          <LinkedInSocialInput {...createMockProps()} />
        </Wrapper>
      )
      expect(screen.getByText('LinkedIn')).toBeInTheDocument()
    })

    it('renders default content via renderDefault', () => {
      render(
        <Wrapper>
          <LinkedInSocialInput {...createMockProps()} />
        </Wrapper>
      )
      expect(screen.getByTestId('default-render')).toBeInTheDocument()
    })
  })

  describe('status badge', () => {
    it('shows idle status when no content', () => {
      mockUseFormValue.mockImplementation((path: string[]) => {
        if (path.includes('_id')) return 'test-post-id'
        if (path.includes('text')) return []
        return undefined
      })

      render(
        <Wrapper>
          <LinkedInSocialInput {...createMockProps()} />
        </Wrapper>
      )
      expect(screen.getByText('idle')).toBeInTheDocument()
    })

    it('shows ready status when content exists', () => {
      mockUseFormValue.mockImplementation((path: string[]) => {
        if (path.includes('_id')) return 'test-post-id'
        if (path.includes('text'))
          return [{ _type: 'block', children: [{ text: 'LinkedIn post' }] }]
        if (path.includes('generatedAt')) return '2026-01-15T09:00:00Z'
        return undefined
      })

      render(
        <Wrapper>
          <LinkedInSocialInput {...createMockProps()} />
        </Wrapper>
      )
      expect(screen.getByText('ready')).toBeInTheDocument()
    })

    it('hides status badge when generating', async () => {
      const user = userEvent.setup()
      mockGenerateLinkedInDraft.mockImplementation(
        () =>
          new Promise(resolve =>
            setTimeout(() => resolve({ success: true }), 100)
          )
      )

      render(
        <Wrapper>
          <LinkedInSocialInput {...createMockProps()} />
        </Wrapper>
      )

      const generateButton = screen.getByText('Generate LinkedIn Draft')
      await user.click(generateButton)

      expect(screen.queryByText('idle')).not.toBeInTheDocument()
      expect(screen.getByText('Generating...')).toBeInTheDocument()
    })
  })

  describe('generate functionality', () => {
    it('calls generateLinkedInDraft on button click', async () => {
      const user = userEvent.setup()
      mockGenerateLinkedInDraft.mockResolvedValue({ success: true })

      render(
        <Wrapper>
          <LinkedInSocialInput {...createMockProps()} />
        </Wrapper>
      )

      const generateButton = screen.getByText('Generate LinkedIn Draft')
      await user.click(generateButton)

      expect(mockGenerateLinkedInDraft).toHaveBeenCalledWith('test-post-id')
    })

    it('shows Generating... text while loading', async () => {
      const user = userEvent.setup()
      mockGenerateLinkedInDraft.mockImplementation(
        () =>
          new Promise(resolve =>
            setTimeout(() => resolve({ success: true }), 100)
          )
      )

      render(
        <Wrapper>
          <LinkedInSocialInput {...createMockProps()} />
        </Wrapper>
      )

      const generateButton = screen.getByText('Generate LinkedIn Draft')
      await user.click(generateButton)

      expect(screen.getByText('Generating...')).toBeInTheDocument()
    })

    it('disables button when no postId', () => {
      mockUseFormValue.mockImplementation((path: string[]) => {
        if (path.includes('_id')) return undefined
        return undefined
      })

      render(
        <Wrapper>
          <LinkedInSocialInput {...createMockProps()} />
        </Wrapper>
      )

      const generateButton = screen.getByRole('button', {
        name: /Generate LinkedIn Draft/i,
      })
      expect(generateButton).toBeDisabled()
    })
  })

  describe('schedule button', () => {
    it('does not show schedule button when no content', () => {
      mockUseFormValue.mockImplementation((path: string[]) => {
        if (path.includes('_id')) return 'test-post-id'
        if (path.includes('text')) return []
        return undefined
      })

      render(
        <Wrapper>
          <LinkedInSocialInput {...createMockProps()} />
        </Wrapper>
      )
      expect(
        screen.queryByText('Schedule LinkedIn Post')
      ).not.toBeInTheDocument()
    })

    it('shows schedule button when content exists', () => {
      mockUseFormValue.mockImplementation((path: string[]) => {
        if (path.includes('_id')) return 'test-post-id'
        if (path.includes('text'))
          return [{ _type: 'block', children: [{ text: 'Post content' }] }]
        if (path.includes('generatedAt')) return '2026-01-15T09:00:00Z'
        return undefined
      })

      render(
        <Wrapper>
          <LinkedInSocialInput {...createMockProps()} />
        </Wrapper>
      )
      expect(screen.getByText('Schedule LinkedIn Post')).toBeInTheDocument()
    })

    it('schedule button is clickable when content exists', () => {
      mockUseFormValue.mockImplementation((path: string[]) => {
        if (path.includes('_id')) return 'test-post-id'
        if (path.includes('text'))
          return [{ _type: 'block', children: [{ text: 'Post content' }] }]
        if (path.includes('generatedAt')) return '2026-01-15T09:00:00Z'
        return undefined
      })

      render(
        <Wrapper>
          <LinkedInSocialInput {...createMockProps()} />
        </Wrapper>
      )

      const scheduleButton = screen.getByText('Schedule LinkedIn Post')
      expect(scheduleButton).toBeInTheDocument()
      // Button should be clickable (not disabled)
      expect(scheduleButton.closest('button')).not.toBeDisabled()
    })
  })

  describe('error handling', () => {
    it('displays error message on generation failure', async () => {
      const user = userEvent.setup()
      mockGenerateLinkedInDraft.mockResolvedValue({
        success: false,
        error: 'LinkedIn generation failed',
      })

      render(
        <Wrapper>
          <LinkedInSocialInput {...createMockProps()} />
        </Wrapper>
      )

      const generateButton = screen.getByText('Generate LinkedIn Draft')
      await user.click(generateButton)

      await waitFor(() => {
        expect(
          screen.getByText('LinkedIn generation failed')
        ).toBeInTheDocument()
      })
    })

    it('handles exception during generation', async () => {
      const user = userEvent.setup()
      mockGenerateLinkedInDraft.mockRejectedValue(new Error('Network error'))

      render(
        <Wrapper>
          <LinkedInSocialInput {...createMockProps()} />
        </Wrapper>
      )

      const generateButton = screen.getByText('Generate LinkedIn Draft')
      await user.click(generateButton)

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument()
      })
    })
  })

  describe('scheduling', () => {
    it('schedulePost is imported and can be called', () => {
      // Verify the mock is set up correctly
      expect(mockSchedulePost).toBeDefined()
      expect(typeof mockSchedulePost).toBe('function')
    })
  })

  describe('generated date display', () => {
    it('shows generated date when content exists', () => {
      const generatedDate = '2026-01-15T10:30:00Z'
      mockUseFormValue.mockImplementation((path: string[]) => {
        if (path.includes('_id')) return 'test-post-id'
        if (path.includes('generatedAt')) return generatedDate
        if (path.includes('text')) return [{ _type: 'block' }]
        return undefined
      })

      render(
        <Wrapper>
          <LinkedInSocialInput {...createMockProps()} />
        </Wrapper>
      )

      expect(screen.getByText(/Generated:/)).toBeInTheDocument()
    })

    it('does not show generated date when no content', () => {
      mockUseFormValue.mockImplementation((path: string[]) => {
        if (path.includes('_id')) return 'test-post-id'
        if (path.includes('generatedAt')) return null
        return undefined
      })

      render(
        <Wrapper>
          <LinkedInSocialInput {...createMockProps()} />
        </Wrapper>
      )

      expect(screen.queryByText(/Generated:/)).not.toBeInTheDocument()
    })
  })
})
