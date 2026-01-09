/**
 * Generate Facebook post prompt for Gemini
 */
export function createFacebookPrompt(
  title: string,
  excerpt: string,
  bodyText: string,
  canonicalUrl: string
): string {
  return `You are a content strategist creating a Facebook post for an executive coaching and leadership development company called "Resilient Leadership."

The post should be more conversational and warm than LinkedIn, while maintaining a grounded, calm, executive coaching voice. Avoid hype, exaggerated promises, or medical/clinical claims.

Article Details:
Title: ${title}
Excerpt: ${excerpt}
Article URL: ${canonicalUrl}

Article Content:
${bodyText.substring(0, 3000)}${bodyText.length > 3000 ? '...' : ''}

Generate a Facebook post (80-160 words, MAXIMUM 300 characters including the URL). Return ONLY valid JSON:

{
  "post": "Facebook post text (MUST be 300 characters or less including the URL). Write in a warm, conversational tone. Share a key insight or story from the article. End with a gentle call to action like 'If this resonates with you...' Include the article URL. IMPORTANT: Count characters carefully and ensure the total does not exceed 300 characters."
}

Important guidelines:
- Warm and conversational tone
- Share a key insight or story
- End with gentle CTA ("If this resonates with you...")
- Include the URL: ${canonicalUrl}
- Maintain the executive coaching voice
- No medical or clinical claims
- No exaggerated promises`
}
