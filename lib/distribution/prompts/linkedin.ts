/**
 * Generate LinkedIn post prompt for Gemini
 */
export function createLinkedInPrompt(
  title: string,
  excerpt: string,
  bodyText: string,
  canonicalUrl: string
): string {
  return `You are a content strategist creating a LinkedIn post for an executive coaching and leadership development company called "Resilient Leadership."

The post should have a grounded, calm, executive coaching voice. Avoid hype, exaggerated promises, or medical/clinical claims.

Article Details:
Title: ${title}
Excerpt: ${excerpt}
Article URL: ${canonicalUrl}

Article Content:
${bodyText.substring(0, 3000)}${bodyText.length > 3000 ? '...' : ''}

Generate a LinkedIn post (120-220 words, MAXIMUM 500 characters). Return ONLY valid JSON:

{
  "post": "LinkedIn post text (MUST be 500 characters or less - do NOT include the URL, it will be added separately). Start with a strong opening line that hooks the reader. Include 1 short story or insight from the article. Include 1 practical takeaway. End with a question to encourage engagement. IMPORTANT: Count characters carefully and ensure the post text does not exceed 500 characters. Do NOT include the article URL in your response."
}

Important guidelines:
- Strong opening that captures attention
- Include a brief story or insight
- Provide one practical takeaway
- End with an engaging question
- Do NOT include the article URL - it will be added automatically
- Maintain professional but approachable tone
- No medical or clinical claims
- No exaggerated promises`
}
