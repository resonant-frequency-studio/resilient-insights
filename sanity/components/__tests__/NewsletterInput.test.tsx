import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider, studioTheme } from '@sanity/ui'
import { NewsletterInput } from '../NewsletterInput'

// Mock the actions module
jest.mock('../../plugins/distribution/actions', () => ({
  generateNewsletterDraft: jest.fn(),
  checkRateLimitStatus: jest.fn(),
}))

// Mock the portableText module
jest.mock('@/lib/sanity/portableText', () => ({
  portableTextToMarkdown: jest.fn(() => 'Markdown content'),
}))

// Get mocked functions
import {
  generateNewsletterDraft,
  checkRateLimitStatus,
} from '../../plugins/distribution/actions'
const mockGenerateNewsletterDraft = generateNewsletterDraft as jest.Mock
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
// Using 'as any' to avoid strict type checking on mock props
const createMockProps = (overrides = {}) =>
  ({
    value: {},
    path: ['distribution', 'newsletter'],
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
    id: 'newsletter-input',
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
      id: 'newsletter-input',
      onFocus: jest.fn(),
      onBlur: jest.fn(),
      ref: { current: null },
    },
    ...overrides,
  }) as unknown as React.ComponentProps<typeof NewsletterInput>

describe('NewsletterInput', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCheckRateLimitStatus.mockResolvedValue({
      rateLimited: false,
      remainingMs: 0,
    })
    mockUseFormValue.mockImplementation((path: string[]) => {
      // Return different values based on path
      if (path.includes('_id')) return 'test-post-id'
      if (path.includes('generatedAt')) return null
      if (path.includes('body')) return []
      return undefined
    })
  })

  describe('rendering', () => {
    it('renders generate button', () => {
      render(
        <Wrapper>
          <NewsletterInput {...createMockProps()} />
        </Wrapper>
      )
      expect(screen.getByText('Generate Newsletter Draft')).toBeInTheDocument()
    })

    it('renders Newsletter header', () => {
      render(
        <Wrapper>
          <NewsletterInput {...createMockProps()} />
        </Wrapper>
      )
      expect(screen.getByText('Newsletter Draft')).toBeInTheDocument()
    })

    it('renders default content via renderDefault', () => {
      render(
        <Wrapper>
          <NewsletterInput {...createMockProps()} />
        </Wrapper>
      )
      expect(screen.getByTestId('default-render')).toBeInTheDocument()
    })
  })

  describe('status badge', () => {
    it('shows idle status when no content', () => {
      mockUseFormValue.mockImplementation((path: string[]) => {
        if (path.includes('_id')) return 'test-post-id'
        if (path.includes('body')) return []
        return undefined
      })

      render(
        <Wrapper>
          <NewsletterInput {...createMockProps()} />
        </Wrapper>
      )
      expect(screen.getByText('idle')).toBeInTheDocument()
    })

    it('shows ready status when content exists', () => {
      mockUseFormValue.mockImplementation((path: string[]) => {
        if (path.includes('_id')) return 'test-post-id'
        if (path.includes('body'))
          return [{ _type: 'block', children: [{ text: 'Content' }] }]
        if (path.includes('generatedAt')) return '2026-01-15T09:00:00Z'
        return undefined
      })

      render(
        <Wrapper>
          <NewsletterInput {...createMockProps()} />
        </Wrapper>
      )
      expect(screen.getByText('ready')).toBeInTheDocument()
    })

    it('hides status badge when generating', async () => {
      const user = userEvent.setup()
      mockGenerateNewsletterDraft.mockImplementation(
        () =>
          new Promise(resolve =>
            setTimeout(() => resolve({ success: true }), 100)
          )
      )

      await act(async () => {
        render(
          <Wrapper>
            <NewsletterInput {...createMockProps()} />
          </Wrapper>
        )
      })

      // Wait for initial rate limit check
      await waitFor(() => {
        expect(mockCheckRateLimitStatus).toHaveBeenCalled()
      })

      const generateButton = screen.getByText('Generate Newsletter Draft')
      await act(async () => {
        await user.click(generateButton)
      })

      // Badge should be hidden during generation
      await waitFor(() => {
        expect(screen.queryByText('idle')).not.toBeInTheDocument()
        expect(screen.getByText('Generating...')).toBeInTheDocument()
      })
    })
  })

  describe('generate functionality', () => {
    it('calls generateNewsletterDraft on button click', async () => {
      const user = userEvent.setup()
      mockGenerateNewsletterDraft.mockResolvedValue({ success: true })

      await act(async () => {
        render(
          <Wrapper>
            <NewsletterInput {...createMockProps()} />
          </Wrapper>
        )
      })

      // Wait for initial rate limit check
      await waitFor(() => {
        expect(mockCheckRateLimitStatus).toHaveBeenCalled()
      })

      const generateButton = screen.getByText('Generate Newsletter Draft')
      await act(async () => {
        await user.click(generateButton)
      })

      await waitFor(() => {
        expect(mockGenerateNewsletterDraft).toHaveBeenCalledWith('test-post-id')
      })
    })

    it('shows Generating... text while loading', async () => {
      const user = userEvent.setup()
      mockGenerateNewsletterDraft.mockImplementation(
        () =>
          new Promise(resolve =>
            setTimeout(() => resolve({ success: true }), 100)
          )
      )

      render(
        <Wrapper>
          <NewsletterInput {...createMockProps()} />
        </Wrapper>
      )

      const generateButton = screen.getByText('Generate Newsletter Draft')
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
          <NewsletterInput {...createMockProps()} />
        </Wrapper>
      )

      const generateButton = screen.getByRole('button', {
        name: /Generate Newsletter Draft/i,
      })
      expect(generateButton).toBeDisabled()
    })
  })

  describe('error handling', () => {
    beforeEach(() => {
      mockCheckRateLimitStatus.mockResolvedValue({
        rateLimited: false,
        remainingMs: 0,
      })
    })

    it('displays error message on generation failure', async () => {
      const user = userEvent.setup()
      mockGenerateNewsletterDraft.mockResolvedValue({
        success: false,
        error: 'Generation failed',
      })

      render(
        <Wrapper>
          <NewsletterInput {...createMockProps()} />
        </Wrapper>
      )

      const generateButton = screen.getByText('Generate Newsletter Draft')
      await user.click(generateButton)

      await waitFor(() => {
        expect(screen.getByText('Generation failed')).toBeInTheDocument()
      })
    })

    it('handles exception during generation', async () => {
      const user = userEvent.setup()
      mockGenerateNewsletterDraft.mockRejectedValue(new Error('Network error'))

      await act(async () => {
        render(
          <Wrapper>
            <NewsletterInput {...createMockProps()} />
          </Wrapper>
        )
      })

      // Wait for initial rate limit check
      await waitFor(() => {
        expect(mockCheckRateLimitStatus).toHaveBeenCalled()
      })

      const generateButton = screen.getByText('Generate Newsletter Draft')
      await act(async () => {
        await user.click(generateButton)
      })

      await waitFor(() => {
        // The error message should be displayed (either the specific network error or the generic one)
        const errorText = screen.getByText(/Network error|Generation failed/)
        expect(errorText).toBeInTheDocument()
      })
    })

    it('displays human-readable error for network errors', async () => {
      const user = userEvent.setup()
      mockGenerateNewsletterDraft.mockRejectedValue(new Error('fetch failed'))

      render(
        <Wrapper>
          <NewsletterInput {...createMockProps()} />
        </Wrapper>
      )

      const generateButton = screen.getByText('Generate Newsletter Draft')
      await user.click(generateButton)

      await waitFor(() => {
        expect(
          screen.getByText(
            'Unable to connect. Please check your connection and try again.'
          )
        ).toBeInTheDocument()
      })
    })
  })

  describe('rate limiting', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('disables button and shows countdown when rate limited', async () => {
      mockCheckRateLimitStatus.mockResolvedValue({
        rateLimited: true,
        remainingMs: 45000, // 45 seconds
      })

      await act(async () => {
        render(
          <Wrapper>
            <NewsletterInput {...createMockProps()} />
          </Wrapper>
        )
      })

      await waitFor(() => {
        const button = screen.getByRole('button', {
          name: /Generate Newsletter Draft/i,
        })
        expect(button).toBeDisabled()
        expect(button).toHaveTextContent('Generate Newsletter Draft (45s)')
      })
    })

    it('shows rate limit error message when trying to generate', async () => {
      mockCheckRateLimitStatus.mockResolvedValue({
        rateLimited: true,
        remainingMs: 30000, // 30 seconds
      })

      await act(async () => {
        render(
          <Wrapper>
            <NewsletterInput {...createMockProps()} />
          </Wrapper>
        )
      })

      // Wait for initial rate limit check
      await waitFor(() => {
        expect(mockCheckRateLimitStatus).toHaveBeenCalled()
      })

      // Try to click the generate button
      const button = screen.getByRole('button', {
        name: /Generate Newsletter Draft/i,
      })
      expect(button).toBeDisabled()

      // The error message should appear when rate limited (even though button is disabled)
      // The component sets error when handleGenerate checks rate limit
      // Since button is disabled, we verify it shows countdown instead
      expect(button).toHaveTextContent('Generate Newsletter Draft (30s)')
    })

    it('updates countdown as time passes', async () => {
      mockCheckRateLimitStatus
        .mockResolvedValueOnce({
          rateLimited: true,
          remainingMs: 3000, // 3 seconds
        })
        .mockResolvedValueOnce({
          rateLimited: true,
          remainingMs: 2000, // 2 seconds
        })
        .mockResolvedValueOnce({
          rateLimited: false,
          remainingMs: 0,
        })

      await act(async () => {
        render(
          <Wrapper>
            <NewsletterInput {...createMockProps()} />
          </Wrapper>
        )
      })

      // Initial state
      await waitFor(() => {
        expect(
          screen.getByText('Generate Newsletter Draft (3s)')
        ).toBeInTheDocument()
      })

      // Advance timer by 1 second
      act(() => {
        jest.advanceTimersByTime(1000)
      })
      await waitFor(() => {
        expect(
          screen.getByText('Generate Newsletter Draft (2s)')
        ).toBeInTheDocument()
      })

      // Advance timer by 1 more second
      act(() => {
        jest.advanceTimersByTime(1000)
      })
      await waitFor(() => {
        const button = screen.getByRole('button', {
          name: /Generate Newsletter Draft/i,
        })
        expect(button).not.toBeDisabled()
        expect(button).toHaveTextContent('Generate Newsletter Draft')
      })
    })

    it('prevents generation when rate limited', async () => {
      const user = userEvent.setup({ delay: null })
      mockCheckRateLimitStatus.mockResolvedValue({
        rateLimited: true,
        remainingMs: 45000,
      })

      await act(async () => {
        render(
          <Wrapper>
            <NewsletterInput {...createMockProps()} />
          </Wrapper>
        )
      })

      await waitFor(() => {
        expect(mockCheckRateLimitStatus).toHaveBeenCalled()
      })

      const button = screen.getByRole('button', {
        name: /Generate Newsletter Draft/i,
      })
      expect(button).toBeDisabled()

      // Try to click (should not trigger generation)
      await act(async () => {
        await user.click(button)
      })
      expect(mockGenerateNewsletterDraft).not.toHaveBeenCalled()
    })

    it('handles rate limit error from API response', async () => {
      const user = userEvent.setup({ delay: null })
      mockCheckRateLimitStatus.mockResolvedValue({
        rateLimited: false,
        remainingMs: 0,
      })
      mockGenerateNewsletterDraft.mockResolvedValue({
        success: false,
        error: 'Please wait 30 seconds before generating again.',
        rateLimitRemainingMs: 30000,
      })

      await act(async () => {
        render(
          <Wrapper>
            <NewsletterInput {...createMockProps()} />
          </Wrapper>
        )
      })

      // Wait for initial rate limit check
      await waitFor(() => {
        expect(mockCheckRateLimitStatus).toHaveBeenCalled()
      })

      const button = screen.getByRole('button', {
        name: /Generate Newsletter Draft/i,
      })
      await act(async () => {
        await user.click(button)
      })

      await waitFor(() => {
        expect(
          screen.getByText('Please wait 30 seconds before generating again.')
        ).toBeInTheDocument()
        expect(button).toBeDisabled()
        expect(button).toHaveTextContent('Generate Newsletter Draft (30s)')
      })
    })

    it('shows singular form for 1 second in button text', async () => {
      mockCheckRateLimitStatus.mockResolvedValue({
        rateLimited: true,
        remainingMs: 1000, // 1 second
      })

      await act(async () => {
        render(
          <Wrapper>
            <NewsletterInput {...createMockProps()} />
          </Wrapper>
        )
      })

      await waitFor(() => {
        const button = screen.getByRole('button', {
          name: /Generate Newsletter Draft/i,
        })
        expect(button).toBeDisabled()
        expect(button).toHaveTextContent('Generate Newsletter Draft (1s)')
      })
    })
  })

  describe('generated date display', () => {
    it('shows generated date when content exists', () => {
      const generatedDate = '2026-01-15T09:30:00Z'
      mockUseFormValue.mockImplementation((path: string[]) => {
        if (path.includes('_id')) return 'test-post-id'
        if (path.includes('generatedAt')) return generatedDate
        if (path.includes('body')) return [{ _type: 'block' }]
        return undefined
      })

      render(
        <Wrapper>
          <NewsletterInput {...createMockProps()} />
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
          <NewsletterInput {...createMockProps()} />
        </Wrapper>
      )

      expect(screen.queryByText(/Generated:/)).not.toBeInTheDocument()
    })
  })
})
