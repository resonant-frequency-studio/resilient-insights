import { PortableTextBlock } from '@sanity/types'

/**
 * Converts plain text to Portable Text blocks
 * Each paragraph (separated by double newlines) becomes a separate block
 * Single newlines within paragraphs are preserved as line breaks
 */
export function plainTextToPortableText(text: string): PortableTextBlock[] {
  if (!text || typeof text !== 'string') {
    return []
  }

  // Split by double newlines to get paragraphs
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim())

  return paragraphs.map((paragraph, index) => ({
    _type: 'block',
    _key: `block-${index}-${Date.now()}`,
    style: 'normal',
    markDefs: [],
    children: [
      {
        _type: 'span',
        _key: `span-${index}-${Date.now()}`,
        text: paragraph.trim(),
        marks: [],
      },
    ],
  }))
}

/**
 * Converts Portable Text blocks back to plain text
 * Useful for APIs that need plain text output
 */
export function portableTextToPlainTextString(
  blocks: PortableTextBlock[] | undefined
): string {
  if (!blocks || !Array.isArray(blocks)) {
    return ''
  }

  const textBlocks: string[] = []

  for (const block of blocks) {
    if (block._type !== 'block') {
      continue
    }

    if (block.children && Array.isArray(block.children)) {
      let blockText = ''
      for (const child of block.children) {
        if (child._type === 'span' && child.text) {
          blockText += child.text
        }
      }
      if (blockText.trim()) {
        textBlocks.push(blockText.trim())
      }
    }
  }

  return textBlocks.join('\n\n')
}
