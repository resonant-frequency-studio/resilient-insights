import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { ThemeProvider, studioTheme } from '@sanity/ui'
import { ManagePostsTool } from '../ManagePostsTool'

const mockFetch = jest.fn()
const mockNavigate = jest.fn()
const mockClient = { fetch: mockFetch }

jest.mock('sanity', () => ({
  useClient: () => mockClient,
}))

jest.mock('../ManagePostsLayout', () => ({
  ManagePostsLayout: () => <div>Manage Social Layout</div>,
}))

jest.mock('sanity/router', () => ({
  useRouter: () => ({
    navigate: mockNavigate,
  }),
}))

describe('ManagePostsTool', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders and loads posts', async () => {
    mockFetch
      .mockResolvedValueOnce([{ _id: 'post-1', title: 'First Post' }])
      .mockResolvedValueOnce({
        _id: 'post-1',
        title: 'First Post',
        distribution: {},
      })

    render(
      <ThemeProvider theme={studioTheme}>
        <ManagePostsTool />
      </ThemeProvider>
    )

    expect(screen.getByText('Manage Social')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toHaveValue('post-1')
    })
  })

  it('shows error when posts fail to load', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    render(
      <ThemeProvider theme={studioTheme}>
        <ManagePostsTool />
      </ThemeProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })
  })

  it('fetches a new post when selection changes', async () => {
    mockFetch
      .mockResolvedValueOnce([
        { _id: 'post-1', title: 'First Post' },
        { _id: 'post-2', title: 'Second Post' },
      ])
      .mockResolvedValueOnce({
        _id: 'post-1',
        title: 'First Post',
        distribution: {},
      })
      .mockResolvedValueOnce({
        _id: 'post-2',
        title: 'Second Post',
        distribution: {},
      })

    render(
      <ThemeProvider theme={studioTheme}>
        <ManagePostsTool />
      </ThemeProvider>
    )

    const select = await screen.findByRole('combobox')
    fireEvent.change(select, { target: { value: 'post-2' } })

    await waitFor(() => {
      expect(
        mockFetch.mock.calls.some(call => call[1] && call[1].id === 'post-2')
      ).toBe(true)
    })
  })
})
