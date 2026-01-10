import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider, studioTheme } from '@sanity/ui'
import { ScheduleModal } from '../ScheduleModal'
import { SanityImageReference } from '@/lib/social/imageOptimizer'

// Mock the imageOptimizer module
jest.mock('@/lib/social/imageOptimizer', () => ({
  getPreviewImageUrl: jest.fn((image, platform) => {
    if (!image) return null
    return `https://cdn.sanity.io/images/test/${platform}-preview.jpg`
  }),
  getPlatformDimensionInfo: jest.fn(platform => {
    const dims: Record<string, string> = {
      linkedin: '1200×627 (1.91:1)',
      facebook: '1200×630 (1.91:1)',
      instagram: '1080×1080 (1:1)',
    }
    return dims[platform] || '1200×627 (1.91:1)'
  }),
  PLATFORM_DIMENSIONS: {
    linkedin: { width: 1200, height: 627, aspectRatio: '1.91:1' },
    facebook: { width: 1200, height: 630, aspectRatio: '1.91:1' },
    instagram: { width: 1080, height: 1080, aspectRatio: '1:1' },
  },
}))

// Wrapper component with theme
const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={studioTheme}>{children}</ThemeProvider>
)

const defaultProps = {
  isOpen: true,
  onClose: jest.fn(),
  onSchedule: jest.fn().mockResolvedValue(undefined),
  channel: 'linkedin' as const,
}

const mockRecommendations = [
  '2026-01-15T09:00:00Z',
  '2026-01-15T12:00:00Z',
  '2026-01-15T17:00:00Z',
]

const mockImage: SanityImageReference = {
  _type: 'image',
  asset: {
    _ref: 'image-abc123-1200x800-jpg',
    _type: 'reference',
  },
}

describe('ScheduleModal', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('rendering', () => {
    it('renders nothing when isOpen is false', () => {
      const { container } = render(
        <Wrapper>
          <ScheduleModal {...defaultProps} isOpen={false} />
        </Wrapper>
      )
      expect(container).toBeEmptyDOMElement()
    })

    it('renders modal with channel name in header', () => {
      render(
        <Wrapper>
          <ScheduleModal {...defaultProps} channel="linkedin" />
        </Wrapper>
      )
      expect(screen.getByText(/Schedule Linkedin Post/i)).toBeInTheDocument()
    })

    it('renders modal with Facebook channel name', () => {
      render(
        <Wrapper>
          <ScheduleModal {...defaultProps} channel="facebook" />
        </Wrapper>
      )
      expect(screen.getByText(/Schedule Facebook Post/i)).toBeInTheDocument()
    })

    it('renders modal with Instagram channel name', () => {
      render(
        <Wrapper>
          <ScheduleModal {...defaultProps} channel="instagram" />
        </Wrapper>
      )
      expect(screen.getByText(/Schedule Instagram Post/i)).toBeInTheDocument()
    })

    it('renders Cancel and Submit buttons', () => {
      render(
        <Wrapper>
          <ScheduleModal {...defaultProps} />
        </Wrapper>
      )
      expect(screen.getByText('Cancel')).toBeInTheDocument()
      expect(screen.getByText('Submit')).toBeInTheDocument()
    })
  })

  describe('recommended times', () => {
    it('displays recommended times as clickable cards', () => {
      render(
        <Wrapper>
          <ScheduleModal
            {...defaultProps}
            recommendations={mockRecommendations}
          />
        </Wrapper>
      )
      expect(screen.getByText('Recommended Times')).toBeInTheDocument()
      // Should show formatted dates
      mockRecommendations.forEach(rec => {
        const formattedDate = new Date(rec).toLocaleString()
        expect(screen.getByText(formattedDate)).toBeInTheDocument()
      })
    })

    it('shows custom date/time label when recommendations exist', () => {
      render(
        <Wrapper>
          <ScheduleModal
            {...defaultProps}
            recommendations={mockRecommendations}
          />
        </Wrapper>
      )
      expect(
        screen.getByText('Or choose custom date and time')
      ).toBeInTheDocument()
    })

    it('shows default date/time label when no recommendations', () => {
      render(
        <Wrapper>
          <ScheduleModal {...defaultProps} recommendations={[]} />
        </Wrapper>
      )
      expect(screen.getByText('Choose date and time')).toBeInTheDocument()
    })

    it('selecting a recommendation enables Submit button', async () => {
      const user = userEvent.setup()
      render(
        <Wrapper>
          <ScheduleModal
            {...defaultProps}
            recommendations={mockRecommendations}
          />
        </Wrapper>
      )

      const submitButton = screen.getByRole('button', { name: /Submit/i })
      expect(submitButton).toBeDisabled()

      const firstRecommendation = screen.getByText(
        new Date(mockRecommendations[0]).toLocaleString()
      )
      await user.click(firstRecommendation)

      expect(submitButton).not.toBeDisabled()
    })
  })

  describe('custom date/time selection', () => {
    it('renders date and time inputs', () => {
      render(
        <Wrapper>
          <ScheduleModal {...defaultProps} />
        </Wrapper>
      )
      // Find date and time inputs by type
      const dateInput = document.querySelector('input[type="date"]')
      const timeInput = document.querySelector('input[type="time"]')
      expect(dateInput).toBeInTheDocument()
      expect(timeInput).toBeInTheDocument()
    })

    it('enables Submit when both date and time are selected', async () => {
      render(
        <Wrapper>
          <ScheduleModal {...defaultProps} />
        </Wrapper>
      )

      const submitButton = screen.getByRole('button', { name: /Submit/i })
      expect(submitButton).toBeDisabled()

      // Find date and time inputs
      const dateInput = document.querySelector(
        'input[type="date"]'
      ) as HTMLInputElement
      const timeInput = document.querySelector(
        'input[type="time"]'
      ) as HTMLInputElement

      // Set values
      fireEvent.change(dateInput, { target: { value: '2026-01-20' } })
      fireEvent.change(timeInput, { target: { value: '14:30' } })

      expect(submitButton).not.toBeDisabled()
    })

    it('Submit remains disabled with only date', async () => {
      render(
        <Wrapper>
          <ScheduleModal {...defaultProps} />
        </Wrapper>
      )

      const dateInput = document.querySelector(
        'input[type="date"]'
      ) as HTMLInputElement
      fireEvent.change(dateInput, { target: { value: '2026-01-20' } })

      const submitButton = screen.getByRole('button', { name: /Submit/i })
      expect(submitButton).toBeDisabled()
    })

    it('Submit remains disabled with only time', async () => {
      render(
        <Wrapper>
          <ScheduleModal {...defaultProps} />
        </Wrapper>
      )

      const timeInput = document.querySelector(
        'input[type="time"]'
      ) as HTMLInputElement
      fireEvent.change(timeInput, { target: { value: '14:30' } })

      const submitButton = screen.getByRole('button', { name: /Submit/i })
      expect(submitButton).toBeDisabled()
    })
  })

  describe('submit functionality', () => {
    it('calls onSchedule with ISO string from recommendation', async () => {
      const user = userEvent.setup()
      const mockOnSchedule = jest.fn().mockResolvedValue(undefined)

      render(
        <Wrapper>
          <ScheduleModal
            {...defaultProps}
            recommendations={mockRecommendations}
            onSchedule={mockOnSchedule}
          />
        </Wrapper>
      )

      const firstRecommendation = screen.getByText(
        new Date(mockRecommendations[0]).toLocaleString()
      )
      await user.click(firstRecommendation)

      const submitButton = screen.getByRole('button', { name: /Submit/i })
      await user.click(submitButton)

      expect(mockOnSchedule).toHaveBeenCalledWith(mockRecommendations[0])
    })

    it('calls onSchedule with ISO string from custom date/time', async () => {
      const user = userEvent.setup()
      const mockOnSchedule = jest.fn().mockResolvedValue(undefined)

      render(
        <Wrapper>
          <ScheduleModal {...defaultProps} onSchedule={mockOnSchedule} />
        </Wrapper>
      )

      const dateInput = document.querySelector(
        'input[type="date"]'
      ) as HTMLInputElement
      const timeInput = document.querySelector(
        'input[type="time"]'
      ) as HTMLInputElement

      fireEvent.change(dateInput, { target: { value: '2026-01-20' } })
      fireEvent.change(timeInput, { target: { value: '14:30' } })

      const submitButton = screen.getByRole('button', { name: /Submit/i })
      await user.click(submitButton)

      expect(mockOnSchedule).toHaveBeenCalledWith(
        expect.stringContaining('2026-01-20')
      )
    })
  })

  describe('cancel functionality', () => {
    it('calls onClose when Cancel is clicked', async () => {
      const user = userEvent.setup()
      const mockOnClose = jest.fn()

      render(
        <Wrapper>
          <ScheduleModal {...defaultProps} onClose={mockOnClose} />
        </Wrapper>
      )

      const cancelButton = screen.getByText('Cancel')
      await user.click(cancelButton)

      expect(mockOnClose).toHaveBeenCalled()
    })

    it('resets state when closed', async () => {
      const user = userEvent.setup()
      const mockOnClose = jest.fn()

      render(
        <Wrapper>
          <ScheduleModal
            {...defaultProps}
            recommendations={mockRecommendations}
            onClose={mockOnClose}
          />
        </Wrapper>
      )

      // Select a recommendation
      const firstRecommendation = screen.getByText(
        new Date(mockRecommendations[0]).toLocaleString()
      )
      await user.click(firstRecommendation)

      // Cancel
      const cancelButton = screen.getByText('Cancel')
      await user.click(cancelButton)

      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  describe('loading state', () => {
    it('shows "Scheduling..." when loading', () => {
      render(
        <Wrapper>
          <ScheduleModal {...defaultProps} loading={true} />
        </Wrapper>
      )
      expect(screen.getByText('Scheduling...')).toBeInTheDocument()
    })

    it('disables Submit button when loading', () => {
      render(
        <Wrapper>
          <ScheduleModal
            {...defaultProps}
            loading={true}
            recommendations={mockRecommendations}
          />
        </Wrapper>
      )
      expect(screen.getByRole('button', { name: /Scheduling/i })).toBeDisabled()
    })
  })

  describe('image preview', () => {
    it('shows image preview when image prop provided', () => {
      render(
        <Wrapper>
          <ScheduleModal {...defaultProps} image={mockImage} />
        </Wrapper>
      )
      expect(screen.getByText('Preview')).toBeInTheDocument()
      expect(screen.getByAltText(/Linkedin preview/i)).toBeInTheDocument()
    })

    it('shows dimension badge with image', () => {
      render(
        <Wrapper>
          <ScheduleModal
            {...defaultProps}
            image={mockImage}
            channel="linkedin"
          />
        </Wrapper>
      )
      expect(screen.getByText('1200×627 (1.91:1)')).toBeInTheDocument()
    })

    it('shows auto-crop note', () => {
      render(
        <Wrapper>
          <ScheduleModal
            {...defaultProps}
            image={mockImage}
            channel="facebook"
          />
        </Wrapper>
      )
      expect(
        screen.getByText('Image auto-cropped for Facebook')
      ).toBeInTheDocument()
    })

    it('does not show image section when no image', () => {
      render(
        <Wrapper>
          <ScheduleModal {...defaultProps} />
        </Wrapper>
      )
      expect(screen.queryByAltText(/Linkedin preview/i)).not.toBeInTheDocument()
    })
  })

  describe('text preview', () => {
    it('shows text preview when textContent prop provided', () => {
      render(
        <Wrapper>
          <ScheduleModal
            {...defaultProps}
            textContent="This is the post content"
          />
        </Wrapper>
      )
      expect(screen.getByText('Preview')).toBeInTheDocument()
      expect(screen.getByText('This is the post content')).toBeInTheDocument()
    })

    it('shows both image and text when both provided', () => {
      render(
        <Wrapper>
          <ScheduleModal
            {...defaultProps}
            image={mockImage}
            textContent="Post content here"
          />
        </Wrapper>
      )
      expect(screen.getByAltText(/Linkedin preview/i)).toBeInTheDocument()
      expect(screen.getByText('Post content here')).toBeInTheDocument()
    })

    it('does not show preview section when no content', () => {
      render(
        <Wrapper>
          <ScheduleModal {...defaultProps} />
        </Wrapper>
      )
      expect(screen.queryByText('Preview')).not.toBeInTheDocument()
    })
  })
})
