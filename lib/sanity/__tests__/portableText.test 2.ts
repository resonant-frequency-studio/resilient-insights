import { PortableTextBlock } from '@sanity/types'
import {
  portableTextToPlainText,
  portableTextToMarkdown,
} from '../portableText'

// Test fixtures
const emptyBlock: PortableTextBlock = {
  _type: 'block',
  _key: 'empty-block',
  children: [],
  markDefs: [],
}

const simpleTextBlock: PortableTextBlock = {
  _type: 'block',
  _key: 'simple-block',
  children: [
    {
      _type: 'span',
      _key: 'span-1',
      text: 'Hello world',
      marks: [],
    },
  ],
  markDefs: [],
}

const multiSpanBlock: PortableTextBlock = {
  _type: 'block',
  _key: 'multi-span-block',
  children: [
    {
      _type: 'span',
      _key: 'span-1',
      text: 'Hello ',
      marks: [],
    },
    {
      _type: 'span',
      _key: 'span-2',
      text: 'world',
      marks: [],
    },
  ],
  markDefs: [],
}

const boldTextBlock: PortableTextBlock = {
  _type: 'block',
  _key: 'bold-block',
  children: [
    {
      _type: 'span',
      _key: 'span-1',
      text: 'This is ',
      marks: [],
    },
    {
      _type: 'span',
      _key: 'span-2',
      text: 'bold',
      marks: ['strong'],
    },
    {
      _type: 'span',
      _key: 'span-3',
      text: ' text',
      marks: [],
    },
  ],
  markDefs: [],
}

const italicTextBlock: PortableTextBlock = {
  _type: 'block',
  _key: 'italic-block',
  children: [
    {
      _type: 'span',
      _key: 'span-1',
      text: 'This is ',
      marks: [],
    },
    {
      _type: 'span',
      _key: 'span-2',
      text: 'italic',
      marks: ['em'],
    },
    {
      _type: 'span',
      _key: 'span-3',
      text: ' text',
      marks: [],
    },
  ],
  markDefs: [],
}

const codeTextBlock: PortableTextBlock = {
  _type: 'block',
  _key: 'code-block',
  children: [
    {
      _type: 'span',
      _key: 'span-1',
      text: 'Use ',
      marks: [],
    },
    {
      _type: 'span',
      _key: 'span-2',
      text: 'console.log()',
      marks: ['code'],
    },
    {
      _type: 'span',
      _key: 'span-3',
      text: ' for debugging',
      marks: [],
    },
  ],
  markDefs: [],
}

const h1Block: PortableTextBlock = {
  _type: 'block',
  _key: 'h1-block',
  style: 'h1',
  children: [
    {
      _type: 'span',
      _key: 'span-1',
      text: 'Main Heading',
      marks: [],
    },
  ],
  markDefs: [],
} as PortableTextBlock

const h2Block: PortableTextBlock = {
  _type: 'block',
  _key: 'h2-block',
  style: 'h2',
  children: [
    {
      _type: 'span',
      _key: 'span-1',
      text: 'Secondary Heading',
      marks: [],
    },
  ],
  markDefs: [],
} as PortableTextBlock

const h3Block: PortableTextBlock = {
  _type: 'block',
  _key: 'h3-block',
  style: 'h3',
  children: [
    {
      _type: 'span',
      _key: 'span-1',
      text: 'Tertiary Heading',
      marks: [],
    },
  ],
  markDefs: [],
} as PortableTextBlock

const h4Block: PortableTextBlock = {
  _type: 'block',
  _key: 'h4-block',
  style: 'h4',
  children: [
    {
      _type: 'span',
      _key: 'span-1',
      text: 'Quaternary Heading',
      marks: [],
    },
  ],
  markDefs: [],
} as PortableTextBlock

const blockquoteBlock: PortableTextBlock = {
  _type: 'block',
  _key: 'quote-block',
  style: 'blockquote',
  children: [
    {
      _type: 'span',
      _key: 'span-1',
      text: 'This is a quote',
      marks: [],
    },
  ],
  markDefs: [],
} as PortableTextBlock

const imageBlock = {
  _type: 'image',
  _key: 'image-block',
  asset: {
    _ref: 'image-abc123',
    _type: 'reference',
  },
} as unknown as PortableTextBlock

describe('portableTextToPlainText', () => {
  describe('edge cases', () => {
    it('returns empty string for undefined input', () => {
      expect(portableTextToPlainText(undefined)).toBe('')
    })

    it('returns empty string for empty array', () => {
      expect(portableTextToPlainText([])).toBe('')
    })

    it('returns empty string for null input', () => {
      expect(
        portableTextToPlainText(null as unknown as PortableTextBlock[])
      ).toBe('')
    })

    it('returns empty string for non-array input', () => {
      expect(
        portableTextToPlainText(
          'not an array' as unknown as PortableTextBlock[]
        )
      ).toBe('')
    })

    it('handles block with empty children', () => {
      expect(portableTextToPlainText([emptyBlock])).toBe('')
    })
  })

  describe('text extraction', () => {
    it('extracts text from simple block', () => {
      expect(portableTextToPlainText([simpleTextBlock])).toBe('Hello world')
    })

    it('concatenates text from multiple spans', () => {
      expect(portableTextToPlainText([multiSpanBlock])).toBe('Hello world')
    })

    it('joins multiple paragraphs with double newlines', () => {
      const result = portableTextToPlainText([simpleTextBlock, multiSpanBlock])
      expect(result).toBe('Hello world\n\nHello world')
    })

    it('strips marks from text', () => {
      expect(portableTextToPlainText([boldTextBlock])).toBe('This is bold text')
      expect(portableTextToPlainText([italicTextBlock])).toBe(
        'This is italic text'
      )
    })
  })

  describe('content filtering', () => {
    it('skips image blocks', () => {
      const result = portableTextToPlainText([
        simpleTextBlock,
        imageBlock,
        multiSpanBlock,
      ])
      expect(result).toBe('Hello world\n\nHello world')
    })

    it('skips non-block types', () => {
      const customBlock = {
        _type: 'customType',
        _key: 'custom',
      } as unknown as PortableTextBlock
      const result = portableTextToPlainText([simpleTextBlock, customBlock])
      expect(result).toBe('Hello world')
    })
  })

  describe('whitespace handling', () => {
    it('trims leading and trailing whitespace', () => {
      const blockWithWhitespace: PortableTextBlock = {
        _type: 'block',
        _key: 'ws-block',
        children: [
          {
            _type: 'span',
            _key: 'span-1',
            text: '  Hello world  ',
            marks: [],
          },
        ],
        markDefs: [],
      }
      expect(portableTextToPlainText([blockWithWhitespace])).toBe('Hello world')
    })

    it('collapses multiple newlines to double newlines', () => {
      // This tests the regex that collapses 3+ newlines to 2
      const blocks = [simpleTextBlock, emptyBlock, simpleTextBlock]
      const result = portableTextToPlainText(blocks)
      expect(result).not.toMatch(/\n{3,}/)
    })
  })
})

describe('portableTextToMarkdown', () => {
  describe('edge cases', () => {
    it('returns empty string for undefined input', () => {
      expect(portableTextToMarkdown(undefined)).toBe('')
    })

    it('returns empty string for empty array', () => {
      expect(portableTextToMarkdown([])).toBe('')
    })

    it('returns empty string for null input', () => {
      expect(
        portableTextToMarkdown(null as unknown as PortableTextBlock[])
      ).toBe('')
    })
  })

  describe('heading styles', () => {
    it('converts h1 to markdown heading', () => {
      expect(portableTextToMarkdown([h1Block])).toBe('# Main Heading')
    })

    it('converts h2 to markdown heading', () => {
      expect(portableTextToMarkdown([h2Block])).toBe('## Secondary Heading')
    })

    it('converts h3 to markdown heading', () => {
      expect(portableTextToMarkdown([h3Block])).toBe('### Tertiary Heading')
    })

    it('converts h4 to markdown heading', () => {
      expect(portableTextToMarkdown([h4Block])).toBe('#### Quaternary Heading')
    })
  })

  describe('text formatting marks', () => {
    it('converts strong mark to bold markdown', () => {
      expect(portableTextToMarkdown([boldTextBlock])).toBe(
        'This is **bold** text'
      )
    })

    it('converts em mark to italic markdown', () => {
      expect(portableTextToMarkdown([italicTextBlock])).toBe(
        'This is *italic* text'
      )
    })

    it('converts code mark to inline code markdown', () => {
      expect(portableTextToMarkdown([codeTextBlock])).toBe(
        'Use `console.log()` for debugging'
      )
    })

    it('handles alternative bold mark (b)', () => {
      const bBlock: PortableTextBlock = {
        _type: 'block',
        _key: 'b-block',
        children: [
          {
            _type: 'span',
            _key: 'span-1',
            text: 'bold',
            marks: ['b'],
          },
        ],
        markDefs: [],
      }
      expect(portableTextToMarkdown([bBlock])).toBe('**bold**')
    })

    it('handles alternative italic mark (i)', () => {
      const iBlock: PortableTextBlock = {
        _type: 'block',
        _key: 'i-block',
        children: [
          {
            _type: 'span',
            _key: 'span-1',
            text: 'italic',
            marks: ['i'],
          },
        ],
        markDefs: [],
      }
      expect(portableTextToMarkdown([iBlock])).toBe('*italic*')
    })
  })

  describe('blockquotes', () => {
    it('converts blockquote style to markdown quote', () => {
      expect(portableTextToMarkdown([blockquoteBlock])).toBe(
        '> This is a quote'
      )
    })
  })

  describe('content filtering', () => {
    it('skips image blocks', () => {
      const result = portableTextToMarkdown([simpleTextBlock, imageBlock])
      expect(result).toBe('Hello world')
    })

    it('skips non-block types', () => {
      const customBlock = {
        _type: 'customType',
        _key: 'custom',
      } as unknown as PortableTextBlock
      const result = portableTextToMarkdown([simpleTextBlock, customBlock])
      expect(result).toBe('Hello world')
    })
  })

  describe('complex documents', () => {
    it('handles mixed content with headings and paragraphs', () => {
      const result = portableTextToMarkdown([
        h1Block,
        simpleTextBlock,
        h2Block,
        boldTextBlock,
      ])
      expect(result).toBe(
        '# Main Heading\n\nHello world\n\n## Secondary Heading\n\nThis is **bold** text'
      )
    })
  })
})
