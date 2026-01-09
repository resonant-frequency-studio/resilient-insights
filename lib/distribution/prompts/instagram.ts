/**
 * Generate Instagram caption prompt for Gemini
 */
export function createInstagramPrompt(
  title: string,
  excerpt: string,
  bodyText: string,
  canonicalUrl: string
): string {
  return `You are a content strategist creating an Instagram caption for an executive coaching and leadership development company called "Resilient Leadership."

The caption should be engaging, use line breaks for readability, and maintain a grounded, calm, executive coaching voice. Avoid hype, exaggerated promises, or medical/clinical claims.

Article Details:
Title: ${title}
Excerpt: ${excerpt}
Article URL: ${canonicalUrl}

Article Content:
${bodyText.substring(0, 3000)}${bodyText.length > 3000 ? '...' : ''}

Generate an Instagram caption (80-150 words, MAXIMUM 300 characters) and hashtags. Return ONLY valid JSON:

{
  "caption": "Instagram caption text (MUST be 300 characters or less). Use line breaks (\\n) for readability. Start with a hook. Share a key insight or quote. End with a call to action. Do NOT include hashtags in the caption. IMPORTANT: Count characters carefully and ensure the caption does not exceed 300 characters.",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", ...],
  "suggestedFirstComment": "Optional first comment suggestion (can be empty string if not needed)"
}

Important guidelines:
- Caption: 80-150 words
- Use \\n for line breaks (every 2-3 sentences)
- Start with an engaging hook
- Share a key insight or quote
- End with a CTA
- Hashtags: 5-10 relevant hashtags (leadership, coaching, resilience, etc.)
- Suggested first comment: Optional, can be used to add the link or additional context
- Maintain the executive coaching voice
- No medical or clinical claims
- No exaggerated promises`
}
