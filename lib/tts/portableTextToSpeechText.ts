import { PortableTextBlock } from '@sanity/types'

/**
 * Converts PortableText to plain text suitable for TTS.
 * Filters out images, alt text, captions, and code blocks.
 */
export function portableTextToSpeechText(body: PortableTextBlock[] | undefined): string {
  if (!body || !Array.isArray(body)) {
    return ''
  }

  const textBlocks: string[] = []

  for (const block of body) {
    // Skip images and all non-block types
    if (block._type !== 'block') {
      // Skip image blocks explicitly
      if (block._type === 'image') {
        continue
      }
      // For code blocks, add a placeholder
      if (block._type === 'code') {
        textBlocks.push('Code example omitted.')
        continue
      }
      // Skip all other custom block types
      continue
    }

    // Process text blocks
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

  // Join blocks with double newlines (paragraph breaks)
  // Normalize whitespace: collapse multiple blank lines
  let result = textBlocks.join('\n\n')
  
  // Collapse 3+ consecutive newlines to 2
  result = result.replace(/\n{3,}/g, '\n\n')
  
  // Trim leading/trailing whitespace
  return result.trim()
}

