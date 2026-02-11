import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Header from '../Header'
import { usePathname } from 'next/navigation'

// Mock Next.js modules
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}))

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({
    src,
    alt,
    width,
    height,
    className,
    fill,
  }: {
    src: string
    alt: string
    width?: number
    height?: number
    className?: string
    fill?: boolean
  }) => {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        className={className}
        {...(fill
          ? { style: { position: 'absolute', inset: 0 } }
          : { width, height })}
      />
    )
  },
}))

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>

describe('Header', () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue('/')
  })

  afterEach(() => {
    jest.clearAllMocks()
    // Reset body overflow
    document.body.style.overflow = ''
  })

  it('renders desktop header with navigation links', () => {
    render(<Header />)
    // Text appears in both desktop and mobile, so use getAllByText
    expect(screen.getAllByText('What We Do').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Articles').length).toBeGreaterThan(0)
    expect(screen.getAllByText('About').length).toBeGreaterThan(0)
  })

  it('renders logo', () => {
    render(<Header />)
    // Logo appears in both desktop and mobile
    const logos = screen.getAllByAltText('Resilient Leadership')
    expect(logos.length).toBeGreaterThan(0)
  })

  it('renders Start a Conversation button', () => {
    render(<Header />)
    // Button appears in both desktop and mobile
    const buttons = screen.getAllByText('Start a Conversation')
    expect(buttons.length).toBeGreaterThan(0)
  })

  it('toggles mobile menu when MenuButton is clicked', async () => {
    const user = userEvent.setup()
    render(<Header />)

    const menuButtons = screen.getAllByLabelText(/open menu|close menu/i)
    const menuButton = menuButtons[0] // Mobile menu button

    // Click to open mobile menu
    await user.click(menuButton)

    // Check that body scroll is locked
    await waitFor(() => {
      expect(document.body.style.overflow).toBe('hidden')
    })
  })

  it('closes mobile menu on route change', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<Header />)

    const menuButtons = screen.getAllByLabelText(/open menu|close menu/i)
    const menuButton = menuButtons[0]

    // Open menu
    await user.click(menuButton)
    await waitFor(() => {
      expect(document.body.style.overflow).toBe('hidden')
    })

    // Simulate route change
    mockUsePathname.mockReturnValue('/new-page')
    rerender(<Header />)

    // Menu should be closed
    await waitFor(() => {
      expect(document.body.style.overflow).toBe('')
    })
  })

  it('restores body scroll when menu closes', async () => {
    const user = userEvent.setup()
    render(<Header />)

    const menuButtons = screen.getAllByLabelText(/open menu|close menu/i)
    const menuButton = menuButtons[0]

    // Open menu
    await user.click(menuButton)
    await waitFor(() => {
      expect(document.body.style.overflow).toBe('hidden')
    })

    // Close menu
    await user.click(menuButton)
    await waitFor(() => {
      expect(document.body.style.overflow).toBe('')
    })
  })

  it('renders Articles link', () => {
    render(<Header />)
    const articlesLinks = screen.getAllByText('Articles')
    expect(articlesLinks.length).toBeGreaterThan(0)
  })
})
