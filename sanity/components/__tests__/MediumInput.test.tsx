import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider, studioTheme } from '@sanity/ui'
import { MediumInput } from '../MediumInput'

// Mock the actions module
jest.mock('../../plugins/distribution/actions', () => ({
  generateMediumDraft: jest.fn(),
}))

// Mock the portableText module
jest.mock('@/lib/sanity/portableText', () => ({
  portableTextToMarkdown: jest.fn(() => 'Markdown content'),
}))

// Get mocked functions
import { generateMediumDraft } from '../../plugins/distribution/actions'
const mockGenerateMediumDraft = generateMediumDraft as jest.Mock

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
    path: ['distribution', 'medium'],
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
    id: 'medium-input',
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
      id: 'medium-input',
      onFocus: jest.fn(),
      onBlur: jest.fn(),
      ref: { current: null },
    },
    ...overrides,
  }) as unknown as React.ComponentProps<typeof MediumInput>

describe('MediumInput', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseFormValue.mockImplementation((path: string[]) => {
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
          <MediumInput {...createMockProps()} />
        </Wrapper>
      )
      expect(screen.getByText('Generate Medium Draft')).toBeInTheDocument()
    })

    it('renders Medium header', () => {
      render(
        <Wrapper>
          <MediumInput {...createMockProps()} />
        </Wrapper>
      )
      expect(screen.getByText('Medium Draft')).toBeInTheDocument()
    })

    it('renders default content via renderDefault', () => {
      render(
        <Wrapper>
          <MediumInput {...createMockProps()} />
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
          <MediumInput {...createMockProps()} />
        </Wrapper>
      )
      expect(screen.getByText('idle')).toBeInTheDocument()
    })

    it('shows ready status when status is ready', () => {
      mockUseFormValue.mockImplementation((path: string[]) => {
        if (path.includes('_id')) return 'test-post-id'
        if (path.includes('body'))
          return [{ _type: 'block', children: [{ text: 'Content' }] }]
        if (path.includes('generatedAt')) return '2026-01-15T09:00:00Z'
        if (path.includes('status')) return 'ready'
        return undefined
      })

      render(
        <Wrapper>
          <MediumInput {...createMockProps()} />
        </Wrapper>
      )
      expect(screen.getByText('ready')).toBeInTheDocument()
    })

    it('hides status badge when generating', async () => {
      const user = userEvent.setup()
      mockGenerateMediumDraft.mockImplementation(
        () =>
          new Promise(resolve =>
            setTimeout(() => resolve({ success: true }), 100)
          )
      )

      render(
        <Wrapper>
          <MediumInput {...createMockProps()} />
        </Wrapper>
      )

      const generateButton = screen.getByText('Generate Medium Draft')
      await user.click(generateButton)

      expect(screen.queryByText('idle')).not.toBeInTheDocument()
      expect(screen.getByText('Generating...')).toBeInTheDocument()
    })
  })

  describe('generate functionality', () => {
    it('calls generateMediumDraft on button click', async () => {
      const user = userEvent.setup()
      mockGenerateMediumDraft.mockResolvedValue({ success: true })

      render(
        <Wrapper>
          <MediumInput {...createMockProps()} />
        </Wrapper>
      )

      const generateButton = screen.getByText('Generate Medium Draft')
      await user.click(generateButton)

      expect(mockGenerateMediumDraft).toHaveBeenCalledWith('test-post-id')
    })

    it('shows Generating... text while loading', async () => {
      const user = userEvent.setup()
      mockGenerateMediumDraft.mockImplementation(
        () =>
          new Promise(resolve =>
            setTimeout(() => resolve({ success: true }), 100)
          )
      )

      render(
        <Wrapper>
          <MediumInput {...createMockProps()} />
        </Wrapper>
      )

      const generateButton = screen.getByText('Generate Medium Draft')
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
          <MediumInput {...createMockProps()} />
        </Wrapper>
      )

      const generateButton = screen.getByRole('button', {
        name: /Generate Medium Draft/i,
      })
      expect(generateButton).toBeDisabled()
    })
  })

  describe('error handling', () => {
    it('displays error message on generation failure', async () => {
      const user = userEvent.setup()
      mockGenerateMediumDraft.mockResolvedValue({
        success: false,
        error: 'Medium generation failed',
      })

      render(
        <Wrapper>
          <MediumInput {...createMockProps()} />
        </Wrapper>
      )

      const generateButton = screen.getByText('Generate Medium Draft')
      await user.click(generateButton)

      await waitFor(
        () => {
          expect(
            screen.getByText(/Medium generation failed/i)
          ).toBeInTheDocument()
        },
        { timeout: 2000 }
      )
    })

    it('handles exception during generation', async () => {
      const user = userEvent.setup()
      mockGenerateMediumDraft.mockRejectedValue(new Error('API error'))

      render(
        <Wrapper>
          <MediumInput {...createMockProps()} />
        </Wrapper>
      )

      const generateButton = screen.getByText('Generate Medium Draft')
      await user.click(generateButton)

      await waitFor(
        () => {
          expect(screen.getByText(/API error/i)).toBeInTheDocument()
        },
        { timeout: 2000 }
      )
    })
  })

  describe('generated date display', () => {
    it('shows generated date when content exists', () => {
      const generatedDate = '2026-01-15T14:00:00Z'
      mockUseFormValue.mockImplementation((path: string[]) => {
        if (path.includes('_id')) return 'test-post-id'
        if (path.includes('generatedAt')) return generatedDate
        if (path.includes('body')) return [{ _type: 'block' }]
        return undefined
      })

      render(
        <Wrapper>
          <MediumInput {...createMockProps()} />
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
          <MediumInput {...createMockProps()} />
        </Wrapper>
      )

      expect(screen.queryByText(/Generated:/)).not.toBeInTheDocument()
    })
  })
})
