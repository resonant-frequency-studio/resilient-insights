import { PortableTextBlock } from '@sanity/types'
import { portableTextToSpeechText } from '../portableTextToSpeechText'

describe('portableTextToSpeechText', () => {
  it('returns empty string for undefined input', () => {
    expect(portableTextToSpeechText(undefined)).toBe('')
  })

  it('returns empty string for empty array', () => {
    expect(portableTextToSpeechText([])).toBe('')
  })

  it('extracts text from simple text blocks', () => {
    const body: PortableTextBlock[] = [
      {
        _type: 'block',
        _key: 'block1',
        children: [
          {
            _type: 'span',
            _key: 'span1',
            text: 'This is the first paragraph.',
            marks: [],
          },
        ],
        markDefs: [],
        style: 'normal',
      },
      {
        _type: 'block',
        _key: 'block2',
        children: [
          {
            _type: 'span',
            _key: 'span2',
            text: 'This is the second paragraph.',
            marks: [],
          },
        ],
        markDefs: [],
        style: 'normal',
      },
    ]

    const result = portableTextToSpeechText(body)
    expect(result).toBe('This is the first paragraph.\n\nThis is the second paragraph.')
  })

  it('excludes image blocks', () => {
    const body: PortableTextBlock[] = [
      {
        _type: 'block',
        _key: 'block1',
        children: [
          {
            _type: 'span',
            _key: 'span1',
            text: 'Text before image.',
            marks: [],
          },
        ],
        markDefs: [],
        style: 'normal',
      },
      {
        _type: 'image',
        _key: 'image1',
        asset: {
          _type: 'reference',
          _ref: 'image-ref',
        },
        alt: 'This alt text should not appear',
      },
      {
        _type: 'block',
        _key: 'block2',
        children: [
          {
            _type: 'span',
            _key: 'span2',
            text: 'Text after image.',
            marks: [],
          },
        ],
        markDefs: [],
        style: 'normal',
      },
    ] as PortableTextBlock[]

    const result = portableTextToSpeechText(body)
    expect(result).toBe('Text before image.\n\nText after image.')
    expect(result).not.toContain('This alt text should not appear')
    expect(result).not.toContain('alt')
  })

  it('excludes image blocks with captions', () => {
    const body: PortableTextBlock[] = [
      {
        _type: 'block',
        _key: 'block1',
        children: [
          {
            _type: 'span',
            _key: 'span1',
            text: 'Paragraph one.',
            marks: [],
          },
        ],
        markDefs: [],
        style: 'normal',
      },
      {
        _type: 'image',
        _key: 'image1',
        asset: {
          _type: 'reference',
          _ref: 'image-ref',
        },
        alt: 'Descriptive alt text',
        caption: 'This caption should not appear in audio',
      },
      {
        _type: 'block',
        _key: 'block2',
        children: [
          {
            _type: 'span',
            _key: 'span2',
            text: 'Paragraph two.',
            marks: [],
          },
        ],
        markDefs: [],
        style: 'normal',
      },
    ] as PortableTextBlock[]

    const result = portableTextToSpeechText(body)
    expect(result).toBe('Paragraph one.\n\nParagraph two.')
    expect(result).not.toContain('Descriptive alt text')
    expect(result).not.toContain('This caption should not appear in audio')
    expect(result).not.toContain('caption')
  })

  it('replaces code blocks with placeholder', () => {
    const body: PortableTextBlock[] = [
      {
        _type: 'block',
        _key: 'block1',
        children: [
          {
            _type: 'span',
            _key: 'span1',
            text: 'Here is some code:',
            marks: [],
          },
        ],
        markDefs: [],
        style: 'normal',
      },
      {
        _type: 'code',
        _key: 'code1',
        code: 'const x = 1;',
        language: 'javascript',
      },
      {
        _type: 'block',
        _key: 'block2',
        children: [
          {
            _type: 'span',
            _key: 'span2',
            text: 'End of code block.',
            marks: [],
          },
        ],
        markDefs: [],
        style: 'normal',
      },
    ] as PortableTextBlock[]

    const result = portableTextToSpeechText(body)
    expect(result).toBe('Here is some code:\n\nCode example omitted.\n\nEnd of code block.')
    expect(result).not.toContain('const x = 1')
    expect(result).toContain('Code example omitted.')
  })

  it('normalizes whitespace and collapses extra blank lines', () => {
    const body: PortableTextBlock[] = [
      {
        _type: 'block',
        _key: 'block1',
        children: [
          {
            _type: 'span',
            _key: 'span1',
            text: 'First paragraph.',
            marks: [],
          },
        ],
        markDefs: [],
        style: 'normal',
      },
      {
        _type: 'block',
        _key: 'block2',
        children: [
          {
            _type: 'span',
            _key: 'span2',
            text: '',
            marks: [],
          },
        ],
        markDefs: [],
        style: 'normal',
      },
      {
        _type: 'block',
        _key: 'block3',
        children: [
          {
            _type: 'span',
            _key: 'span3',
            text: 'Second paragraph.',
            marks: [],
          },
        ],
        markDefs: [],
        style: 'normal',
      },
    ]

    const result = portableTextToSpeechText(body)
    // Should have double newline between paragraphs, no extra blank lines
    expect(result).toBe('First paragraph.\n\nSecond paragraph.')
  })

  it('handles complex content with multiple images and code blocks', () => {
    const body: PortableTextBlock[] = [
      {
        _type: 'block',
        _key: 'block1',
        children: [
          {
            _type: 'span',
            _key: 'span1',
            text: 'Introduction text.',
            marks: [],
          },
        ],
        markDefs: [],
        style: 'normal',
      },
      {
        _type: 'image',
        _key: 'img1',
        asset: { _type: 'reference', _ref: 'img1' },
        alt: 'Should not appear',
        caption: 'Also should not appear',
      },
      {
        _type: 'block',
        _key: 'block2',
        children: [
          {
            _type: 'span',
            _key: 'span2',
            text: 'Middle paragraph.',
            marks: [],
          },
        ],
        markDefs: [],
        style: 'normal',
      },
      {
        _type: 'code',
        _key: 'code1',
        code: 'console.log("hidden")',
        language: 'javascript',
      },
      {
        _type: 'block',
        _key: 'block3',
        children: [
          {
            _type: 'span',
            _key: 'span3',
            text: 'Conclusion.',
            marks: [],
          },
        ],
        markDefs: [],
        style: 'normal',
      },
    ] as PortableTextBlock[]

    const result = portableTextToSpeechText(body)
    expect(result).toBe(
      'Introduction text.\n\nMiddle paragraph.\n\nCode example omitted.\n\nConclusion.'
    )
    expect(result).not.toContain('Should not appear')
    expect(result).not.toContain('Also should not appear')
    expect(result).not.toContain('console.log')
    expect(result).toContain('Code example omitted.')
  })

  it('trims leading and trailing whitespace', () => {
    const body: PortableTextBlock[] = [
      {
        _type: 'block',
        _key: 'block1',
        children: [
          {
            _type: 'span',
            _key: 'span1',
            text: '   Trimmed text.   ',
            marks: [],
          },
        ],
        markDefs: [],
        style: 'normal',
      },
    ]

    const result = portableTextToSpeechText(body)
    expect(result).toBe('Trimmed text.')
    expect(result).not.toMatch(/^\s+/)
    expect(result).not.toMatch(/\s+$/)
  })
})
