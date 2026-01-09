import { PortableTextBlock } from '@sanity/types'

/**
 * Converts PortableText to plain text
 * Strips images, code blocks, and other non-text content
 */
export function portableTextToPlainText(
  blocks: PortableTextBlock[] | undefined
): string {
  if (!blocks || !Array.isArray(blocks)) {
    return ''
  }

  const textBlocks: string[] = []

  for (const block of blocks) {
    // Skip images and all non-block types
    if (block._type !== 'block') {
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
  let result = textBlocks.join('\n\n')

  // Collapse 3+ consecutive newlines to 2
  result = result.replace(/\n{3,}/g, '\n\n')

  return result.trim()
}

/**
 * Converts PortableText to Markdown
 * Suitable for Medium and other Markdown-based platforms
 */
export function portableTextToMarkdown(
  blocks: PortableTextBlock[] | undefined
): string {
  if (!blocks || !Array.isArray(blocks)) {
    return ''
  }

  const markdownBlocks: string[] = []

  for (const block of blocks) {
    // Skip images (they'll be handled separately if needed)
    if (block._type === 'image') {
      continue
    }

    // Skip non-block types
    if (block._type !== 'block') {
      continue
    }

    // Process text blocks
    if (block.children && Array.isArray(block.children)) {
      let blockText = ''

      for (const child of block.children) {
        if (child._type === 'span' && child.text) {
          let text = child.text

          // Handle marks (bold, italic, etc.)
          if (child.marks && Array.isArray(child.marks)) {
            for (const mark of child.marks) {
              if (mark === 'strong' || mark === 'b') {
                text = `**${text}**`
              } else if (mark === 'em' || mark === 'i') {
                text = `*${text}*`
              } else if (mark === 'code') {
                text = `\`${text}\``
              }
            }
          }

          blockText += text
        }
      }

      if (blockText.trim()) {
        // Handle block styles
        const style = (block as { style?: string }).style

        if (style === 'h1') {
          markdownBlocks.push(`# ${blockText.trim()}`)
        } else if (style === 'h2') {
          markdownBlocks.push(`## ${blockText.trim()}`)
        } else if (style === 'h3') {
          markdownBlocks.push(`### ${blockText.trim()}`)
        } else if (style === 'h4') {
          markdownBlocks.push(`#### ${blockText.trim()}`)
        } else if (style === 'blockquote') {
          markdownBlocks.push(`> ${blockText.trim()}`)
        } else {
          markdownBlocks.push(blockText.trim())
        }
      }
    }
  }

  // Join blocks with double newlines
  let result = markdownBlocks.join('\n\n')

  // Collapse 3+ consecutive newlines to 2
  result = result.replace(/\n{3,}/g, '\n\n')

  return result.trim()
}
