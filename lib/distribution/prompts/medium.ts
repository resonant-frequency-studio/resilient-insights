import { z } from 'zod'

export const mediumSchema = z.object({
  title: z.string().max(100),
  subtitle: z.string().max(200).optional(),
  content: z.string().min(500), // Minimum article length
  tags: z.array(z.string()).min(1).max(5), // Medium allows up to 5 tags
})

export type MediumOutput = z.infer<typeof mediumSchema>

/**
 * Generate Medium-ready article prompt for Gemini
 */
export function createMediumPrompt(
  title: string,
  excerpt: string,
  bodyText: string,
  canonicalUrl: string,
  tags: string[] = []
): string {
  return `You are a content editor specializing in Medium.com article formatting for an executive coaching and leadership development company called "Resilient Leadership."

Your task is to transform an article into Medium-optimized markdown format that can be directly copied and pasted into Medium's post editor.

Article Details:
Title: ${title}
Excerpt: ${excerpt}
Canonical URL: ${canonicalUrl}
Original Categories/Tags: ${tags.join(', ') || 'None'}

Article Body (first 8000 words):
${bodyText.substring(0, 40000)}${bodyText.length > 40000 ? '...' : ''}

Generate a Medium-ready article with the following structure. Return ONLY valid JSON:

{
  "title": "Article title optimized for Medium (compelling, SEO-friendly, max 100 chars)",
  "subtitle": "Optional subtitle or preview text (max 200 chars, can be empty string)",
  "content": "Full article content in Medium-optimized markdown. Include:\n- Canonical URL attribution at the very top: 'Originally published at ${canonicalUrl}' followed by two blank lines\n- Proper heading hierarchy: # for main sections, ## for subsections, ### for sub-subsections\n- Well-formatted paragraphs with proper spacing\n- Use **bold** for emphasis (not *italic* for emphasis, Medium prefers **)\n- Use *italic* for subtle emphasis or quotes\n- Format lists as standard markdown (bulleted or numbered)\n- Use > for blockquotes\n- Use \`code\` for inline code and triple backticks for code blocks\n- Ensure content flows naturally and is optimized for Medium's reading experience\n- Maintain the executive coaching voice: grounded, calm, not hypey\n- No medical or clinical claims\n- No exaggerated promises",
  "tags": ["tag1", "tag2", "tag3"] // Array of 1-5 relevant tags for Medium, derived from categories or article content. Use general, discoverable tags.
}

Important formatting guidelines:
- Start content with: "Originally published at ${canonicalUrl}\n\n---\n\n" (two blank lines after URL, then horizontal rule)
- Use # for main section headings (H1)
- Use ## for subsection headings (H2)
- Use ### for sub-subsection headings (H3)
- Keep paragraphs to 3-5 sentences for readability
- Use **bold** for key terms or emphasis (Medium's preference)
- Use *italic* sparingly for subtle emphasis
- Format lists properly with markdown syntax
- Ensure all content maintains the grounded, executive coaching tone
- Do not include any medical or clinical claims
- Do not include exaggerated promises or guarantees
- Tags should be relevant, general, and discoverable on Medium
- Content should be complete and ready to paste into Medium editor`
}
