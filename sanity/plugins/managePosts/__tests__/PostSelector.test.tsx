import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeProvider, studioTheme } from '@sanity/ui'
import { PostSelector } from '../PostSelector'

describe('PostSelector', () => {
  it('shows loading state', () => {
    render(
      <ThemeProvider theme={studioTheme}>
        <PostSelector
          posts={[]}
          selectedPostId=""
          onChange={jest.fn()}
          loading
        />
      </ThemeProvider>
    )

    expect(screen.getByText('Loading posts...')).toBeInTheDocument()
  })

  it('shows empty state when no posts', () => {
    render(
      <ThemeProvider theme={studioTheme}>
        <PostSelector posts={[]} selectedPostId="" onChange={jest.fn()} />
      </ThemeProvider>
    )

    expect(screen.getByRole('combobox')).toBeInTheDocument()
    expect(screen.getByText('No posts available')).toBeInTheDocument()
  })

  it('renders posts and handles selection', () => {
    const handleChange = jest.fn()
    render(
      <ThemeProvider theme={studioTheme}>
        <PostSelector
          posts={[
            { _id: 'post-1', title: 'First Post' },
            { _id: 'post-2', title: 'Second Post' },
          ]}
          selectedPostId="post-1"
          onChange={handleChange}
        />
      </ThemeProvider>
    )

    const select = screen.getByRole('combobox')
    expect(select).toHaveValue('post-1')

    fireEvent.change(select, { target: { value: 'post-2' } })
    expect(handleChange).toHaveBeenCalledWith('post-2')
  })
})
