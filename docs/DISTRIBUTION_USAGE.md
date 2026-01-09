# Distribution Feature Usage Guide

This guide explains how to use the Distribution feature in Sanity Studio to generate and publish content across multiple channels.

## Overview

The Distribution feature helps you:

1. Generate newsletter and social media content from your blog posts
2. Schedule social drafts to Buffer via Make.com webhook
3. Publish to Medium (or get Medium-ready markdown)

## Workflow

### Step 1: Create or Edit a Post

1. Open Sanity Studio: `http://localhost:3000/studio`
2. Create a new post or open an existing one
3. Fill in the required fields:
   - Title
   - Slug
   - Excerpt (recommended for better generation)
   - Body content

### Step 2: Generate Content

#### Generate Newsletter Draft

1. In the post document, scroll to the **Distribution** section
2. Click **"Generate Newsletter Draft"**
3. Wait for generation (usually 10-30 seconds)
4. Review the generated content:
   - **Subject**: Email subject line
   - **Preheader**: Text that appears after subject in email clients
   - **Body**: Email body text (150-250 words)
   - **CTA Text**: Call-to-action button text
   - **CTA URL**: Link to the full article

5. Edit the generated content if needed (it's saved in Sanity)
6. Use the **"Copy"** buttons to copy content to clipboard

#### Generate Social Drafts

1. Click **"Generate Social Drafts"**
2. Wait for generation
3. Review the generated content:
   - **LinkedIn**: Post text (120-220 words) with article URL
   - **Facebook**: Post text (80-160 words) with article URL
   - **Instagram**: Caption (80-150 words) with hashtags
   - **Suggested First Comment**: Optional comment for Instagram

4. Edit the generated content if needed
5. Use **"Copy"** buttons to copy to clipboard

### Step 3: Connect LinkedIn Account (Required for Scheduling)

Before scheduling LinkedIn posts, you need to connect your LinkedIn account:

1. In the Distribution panel, find the **"LinkedIn Account"** section
2. Click **"Connect LinkedIn"**
3. You'll be redirected to LinkedIn to authorize the app
4. After authorization, you'll be redirected back to Sanity Studio
5. The status should show **"Connected"**

### Step 4: Schedule Social Media Posts

1. In the post document, click the **"Generate distribution content"** action button (in the document actions menu)
2. A dialog will open
3. Select the channels you want to generate and schedule:
   - **LinkedIn**
   - **Facebook**
   - **Instagram**
   - You can select one or more channels
4. Click **"Generate & Schedule"**
5. The system will:
   - Generate social media content using Gemini AI
   - Send the content to Make.com webhook
   - Make.com will create drafts in Buffer
6. Wait for the process to complete (usually 30-60 seconds)
7. Check the **Buffer Status** section in the Distribution field:
   - Status should show "pushed" or "queued"
   - Make.com job ID will be stored (if available)
8. In Buffer, verify the drafts were created and schedule them as needed

**Note**:

- Drafts are created in Buffer, not published. You still need to schedule them in Buffer's interface.
- If the status shows "error", check Make.com execution history for details.
- You can view generated previews in the dialog before scheduling.

### Step 5: Generate Medium Draft

1. Click **"Publish to Medium"** (or "Generate Medium Draft")
2. The system will:
   - Use Gemini AI to generate Medium-optimized content
   - Format the content with proper headings and markdown
   - Include canonical URL attribution
   - Generate relevant tags
   - Save everything to the Distribution field
3. Check the **Medium Status** section:
   - Status should show "ready" if successful
   - Title, subtitle, and tags are displayed
   - Full content is available in the textarea
4. Copy the content:
   - Click **"Copy Full Content to Clipboard"**
   - Or copy title, subtitle, and content separately
5. Paste into Medium:
   - Go to [Medium's new story page](https://medium.com/new-story)
   - Paste the content into the editor
   - Add the tags manually in Medium's tag field (or use the generated tags)
   - Review and publish in Medium

**Note**:

- Medium has no API, so manual copy/paste is required
- The generated content is optimized for Medium's editor
- You can edit the content in Medium before publishing
- All content is saved in Sanity for future reference

## Editing Generated Content

All generated content is saved in Sanity and can be edited:

1. Find the content in the **Distribution** section
2. Edit the text fields directly
3. Changes are saved automatically
4. You can regenerate at any time (will overwrite current content)

## Regenerating Content

To regenerate content:

1. Click the generate button again
2. The system will overwrite existing content
3. Previous content is not saved (consider copying before regenerating)

**Note**: There's a rate limit of 1 request per minute per post to prevent accidental spam.

## Status Indicators

### Buffer Status

- **idle**: Not yet pushed
- **queued**: Push in progress
- **pushed**: Successfully pushed to Buffer
- **error**: Push failed (check error message)

### Medium Status

- **idle**: Not yet published
- **ready**: Markdown generated, ready for manual publish
- **published**: Successfully published via API
- **error**: Publish failed (check error message)

## Best Practices

1. **Generate after finalizing content**: Generate distribution content after your post is complete and reviewed

2. **Review and edit**: Always review AI-generated content before publishing
   - Check tone and voice
   - Verify facts and claims
   - Ensure it matches your brand

3. **Customize per channel**: Edit social posts to match each platform's style
   - LinkedIn: Professional, thought leadership
   - Facebook: Conversational, warm
   - Instagram: Visual, engaging

4. **Use excerpts**: Having a good excerpt helps generate better content

5. **Test first**: Generate content for a test post first to understand the output

6. **Schedule thoughtfully**: Use Buffer to schedule posts at optimal times

## Troubleshooting

### Generation fails

- Check that `GOOGLE_GEMINI_API_KEY` is set
- Verify your API key is valid
- Check rate limits (wait 1 minute between requests)

### Buffer push fails

- Verify `BUFFER_ACCESS_TOKEN` is set
- Check that profile IDs are correct
- Ensure profiles are connected in Buffer

### Content quality issues

- Regenerate with different prompts (may require code changes)
- Edit generated content manually
- Provide better excerpts and titles

### Rate limiting

- Wait 1 minute between generation requests
- Consider upgrading Gemini API plan for higher limits

## Advanced Usage

### Customizing Prompts

To customize the AI prompts, edit files in `lib/distribution/prompts/`:

- `newsletter.ts`
- `linkedin.ts`
- `facebook.ts`
- `instagram.ts`

### Adding New Channels

To add new distribution channels:

1. Add fields to `sanity/schemas/post.ts`
2. Create a new prompt in `lib/distribution/prompts/`
3. Update `lib/distribution/generate.ts`
4. Add UI in `sanity/plugins/distribution/DistributionTool.tsx`

## Support

For issues or questions:

1. Check the troubleshooting section
2. Review error messages in the Distribution panel
3. Check server logs for detailed error information
4. Verify all environment variables are set correctly
