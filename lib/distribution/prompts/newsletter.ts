/**
 * Generate newsletter prompt for Gemini
 */
export function createNewsletterPrompt(
  title: string,
  excerpt: string,
  bodyText: string,
  canonicalUrl: string
): string {
  return `You are a content strategist creating an email newsletter for an executive coaching and leadership development company called "Resilient Leadership."

The newsletter should have a grounded, calm, executive coaching voice. Avoid hype, exaggerated promises, or medical/clinical claims.

Article Details:
Title: ${title}
Excerpt: ${excerpt}
Article URL: ${canonicalUrl}

Article Content:
${bodyText.substring(0, 3000)}${bodyText.length > 3000 ? '...' : ''}

Generate a newsletter email with the following structure. Return ONLY valid JSON:

{
  "title": "Newsletter title (EXACTLY 100 characters or less - compelling headline for the newsletter)",
  "subtitle": "Newsletter subtitle (EXACTLY 150 characters or less - supporting text that expands on the title)",
  "body": "Email body text (150-250 words, approximately 750-1250 characters, MAXIMUM 2000 characters). Use short paragraphs (2-3 sentences max). Include 1-3 bullet points if helpful. Write in a warm, professional tone. CRITICAL: You MUST end the body with a clear call-to-action that includes the exact text 'Read the full article' followed by the article URL (${canonicalUrl}). Format it as: 'Read the full article: [URL]' or similar. The CTA should be the final sentence or paragraph of the body. IMPORTANT: Count characters and ensure body does not exceed 2000 characters.",
  "ctaText": "Read the full article",
  "ctaUrl": "${canonicalUrl}"
}

Important guidelines:
- Title should be clear and benefit-focused, not clickbait
- Subtitle should complement the title and provide additional context
- Body should be concise and scannable
- Body MUST end with a call-to-action that includes "Read the full article" and the article URL (${canonicalUrl})
- The CTA should be integrated naturally into the body text, not as a separate field
- Use the exact CTA URL provided in the body text
- Maintain the executive coaching voice throughout
- No medical or clinical claims
- No exaggerated promises or guarantees`
}
