import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider, studioTheme } from '@sanity/ui'
import { NewsletterInput } from '../NewsletterInput'

// Mock the actions module
jest.mock('../../plugins/distribution/actions', () => ({
  generateNewsletterDraft: jest.fn(),
}))

// Mock the portableText module
jest.mock('@/lib/sanity/portableText', () => ({
  portableTextToMarkdown: jest.fn(blocks => 'Markdown content'),
}))

// Get mocked functions
import { generateNewsletterDraft } from '../../plugins/distribution/actions'
const mockGenerateNewsletterDraft = generateNewsletterDraft as jest.Mock

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
const createMockProps = (overrides = {}) => ({
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
  focused: false,
  readOnly: false,
  presence: [],
  validation: [],
  members: [],
  groups: [],
  id: 'newsletter-input',
  level: 0,
  renderDefault: jest.fn(() => (
    <div data-testid="default-render">Default Render</div>
  )),
  renderField: jest.fn(),
  renderInput: jest.fn(),
  renderItem: jest.fn(),
  renderPreview: jest.fn(),
  elementProps: {
    id: 'newsletter-input',
    onFocus: jest.fn(),
    onBlur: jest.fn(),
  },
  ...overrides,
})

describe('NewsletterInput', () => {
  beforeEach(() => {
    jest.clearAllMocks()
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
      expect(screen.getByText('Newsletter')).toBeInTheDocument()
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

      render(
        <Wrapper>
          <NewsletterInput {...createMockProps()} />
        </Wrapper>
      )

      const generateButton = screen.getByText('Generate Newsletter Draft')
      await user.click(generateButton)

      // Badge should be hidden during generation
      expect(screen.queryByText('idle')).not.toBeInTheDocument()
      expect(screen.getByText('Generating...')).toBeInTheDocument()
    })
  })

  describe('generate functionality', () => {
    it('calls generateNewsletterDraft on button click', async () => {
      const user = userEvent.setup()
      mockGenerateNewsletterDraft.mockResolvedValue({ success: true })

      render(
        <Wrapper>
          <NewsletterInput {...createMockProps()} />
        </Wrapper>
      )

      const generateButton = screen.getByText('Generate Newsletter Draft')
      await user.click(generateButton)

      expect(mockGenerateNewsletterDraft).toHaveBeenCalledWith('test-post-id')
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

      render(
        <Wrapper>
          <NewsletterInput {...createMockProps()} />
        </Wrapper>
      )

      const generateButton = screen.getByText('Generate Newsletter Draft')
      await user.click(generateButton)

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument()
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
