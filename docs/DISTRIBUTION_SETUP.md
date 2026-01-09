# Distribution Feature Setup Guide

This guide will help you set up the Distribution feature for generating and publishing content across multiple channels.

## Overview

The Distribution feature allows you to:

- Generate newsletter drafts using Gemini AI
- Generate social media posts (LinkedIn, Facebook, Instagram) using Gemini AI
- Schedule social drafts to Buffer via Make.com webhook
- Publish posts to Medium (or generate Medium-ready markdown)

## Prerequisites

- Node.js 18+ installed
- Sanity project with write access
- API keys for the services you want to use

## Step 1: Environment Variables

Create or update your `.env.local` file with the following variables.

**Note**: Create a `.env.local.example` file in your project root with these variables (without actual values) as a template for your team:

```bash
# Sanity Configuration (you should already have these)
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2024-01-01

# Sanity Write Token (REQUIRED)
# Generate at: https://sanity.io/manage → Your Project → API → Tokens
# Create a new token with "Editor" permissions
SANITY_WRITE_TOKEN=your_write_token_here

# Site URLs
SITE_BASE_URL=https://articles.resilientleadership.us
MAIN_SITE_URL=https://resilientleadership.us

# Google Gemini API (REQUIRED for content generation)
# Get your API key at: https://makersuite.google.com/app/apikey
GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here

# Make.com Webhook (REQUIRED for social media scheduling via Buffer)
# See Make.com setup section below
MAKE_WEBHOOK_URL=https://hook.us2.make.com/your_webhook_path_here
MAKE_WEBHOOK_SECRET=your_secure_webhook_secret_here


# Distribution API Security (REQUIRED)
# Generate a secure random string (e.g., using: openssl rand -hex 32)
DISTRIBUTION_SECRET=your_secure_random_string_here

# For Studio client-side (if needed)
NEXT_PUBLIC_DISTRIBUTION_SECRET=your_secure_random_string_here
```

**Creating .env.local.example**: Copy the above template to `.env.local.example` in your project root, replacing all actual values with placeholder text like `your_project_id`, `your_write_token_here`, etc. This file should be committed to version control as a template for your team.

## Step 2: Google Gemini API Setup

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the API key and add it to `.env.local` as `GOOGLE_GEMINI_API_KEY`
5. The API key provides free tier access with rate limits

**Note**: The free tier has rate limits. For production use, consider upgrading to a paid plan.

## Step 3: LinkedIn OAuth Setup (REQUIRED for LinkedIn scheduling)

LinkedIn scheduling requires OAuth authentication to post on your behalf.

### 3.1: Register LinkedIn App

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Click **"Create app"**
3. Fill in app details:
   - **App name**: Resilient Insights Scheduler (or your preferred name)
   - **LinkedIn Page**: Select your company page (if applicable)
   - **Privacy policy URL**: Your privacy policy URL
   - **App logo**: Upload a logo (optional)
4. Click **"Create app"**

### 3.2: Configure OAuth Settings

1. In your app settings, go to **"Auth"** tab
2. Add **Redirect URLs**:
   - Development: `http://localhost:3000/api/auth/linkedin/callback`
   - Production: `https://articles.resilientleadership.us/api/auth/linkedin/callback`
3. Under **Products**, you'll see two sections:
   - **Added products**: "Sign In with LinkedIn using OpenID Connect" should already be listed here (Standard Tier)
   - **Available products**: Find and click **"Request access"** for:
     - **Share on LinkedIn** (Default Tier) - Required for posting content to LinkedIn
4. After requesting "Share on LinkedIn", wait for approval (usually instant for Default Tier products)
5. The OAuth scopes used in the application are:
   - `w_member_social` - Post, comment, and share on behalf of the user (required for posting)
   - `openid` - OpenID Connect authentication (provided by Sign In with LinkedIn)
   - `profile` - Read basic profile information
   - `email` - Read email address (optional)

### 3.3: Get OAuth Credentials

1. In the **"Auth"** tab, copy:
   - **Client ID**
   - **Client Secret**
2. Add these to `.env.local`:
   ```bash
   LINKEDIN_CLIENT_ID=your_client_id_here
   LINKEDIN_CLIENT_SECRET=your_client_secret_here
   LINKEDIN_REDIRECT_URI=https://articles.resilientleadership.us/api/auth/linkedin/callback
   ```

### 3.4: Test LinkedIn Connection

1. In Sanity Studio, open a post
2. Go to the Distribution panel
3. Click **"Connect LinkedIn"**
4. You'll be redirected to LinkedIn to authorize the app
5. Grant the requested permissions (posting and profile access)
6. After authorization, you'll be redirected back to Sanity Studio
7. You should see "Connected" status in the LinkedIn Account section

**Note**: If you see an error about missing permissions, ensure:

- "Share on LinkedIn" product is approved in your LinkedIn app
- The OAuth scopes include `w_member_social` for posting

## Step 4: Inngest Setup (REQUIRED for job scheduling)

Inngest handles reliable job scheduling and execution for social media posts.

### 4.1: Create Inngest Account

1. Sign up at [Inngest](https://www.inngest.com)
2. Create a new app or organization

### 4.2: Connect Vercel Project

1. In Inngest dashboard, go to **"Apps"**
2. Click **"Add App"** → **"Vercel"**
3. Follow the integration steps to connect your Vercel project
4. Or manually add your app:
   - **App Name**: resilient-insights-scheduler
   - **Event Key**: Copy from Inngest dashboard
   - **Signing Key**: Copy from Inngest dashboard

### 4.3: Configure Environment Variables

Add to `.env.local`:

```bash
INNGEST_EVENT_KEY=your_event_key_from_inngest_dashboard
INNGEST_SIGNING_KEY=your_signing_key_from_inngest_dashboard
```

### 4.4: Local Development

For local development, install Inngest Dev Server:

```bash
npx inngest-cli@latest dev
```

This will start the Inngest dev server on `http://localhost:8288`

## Step 5: Make.com Setup (DEPRECATED)

Make.com integration is deprecated. Social media scheduling now uses direct platform APIs via Inngest.

The following section is kept for reference only:

### 5.1: Create Make.com Account (DEPRECATED)

1. Sign up at [Make.com](https://www.make.com) (formerly Integromat)
2. Choose a plan (free tier available for testing)

### 3.2: Create a New Scenario

1. In Make.com, click **"Create a new scenario"**
2. Name it "Social Media Distribution to Buffer"

### 3.3: Add Webhook Trigger

1. Click the **"+"** button to add a module
2. Search for **"Webhooks"** → Select **"Custom webhook"**
3. Choose **"Instant webhook"** (for real-time processing)
4. Click **"Save"** to create the webhook
5. Copy the **webhook URL** (e.g., `https://hook.us2.make.com/abc123xyz`)
6. Add this URL to `.env.local` as `MAKE_WEBHOOK_URL`

### 3.4: Generate Webhook Secret

Generate a secure random string for webhook authentication:

```bash
# Using OpenSSL
openssl rand -hex 32

# Or using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Add this to `.env.local` as `MAKE_WEBHOOK_SECRET`

### 3.5: Configure Webhook Authentication (Optional but Recommended)

The application sends authentication via the `x-make-apikey` header with your `MAKE_WEBHOOK_SECRET` value.

In Make.com webhook settings (optional validation):

1. Go to webhook module settings
2. Enable **"Show advanced settings"**
3. You can add a filter to validate the `x-make-apikey` header if desired
4. Alternatively, validate the header in a later module using a filter

**Note**: The application automatically includes `x-make-apikey` header with all webhook requests. Make.com will receive this header for validation if you configure it.

### 3.6: Add Router Module

1. Add a **"Router"** module after the webhook
2. This will route to different Buffer modules based on the channel

### 3.7: Configure Buffer Integration

For each social platform (LinkedIn, Facebook, Instagram):

#### Route 1: LinkedIn

1. In the Router, add a route (Route 1)
2. Add a **"Filter"** condition:
   - Field: `channels.linkedin`
   - Operator: **"Exists"**
3. Add **"Buffer"** → **"Create an Update"** module
4. Connect your Buffer account (first time: authorize via OAuth)
5. Map fields:
   - **Profile**: Select your LinkedIn profile
   - **Text**: `{{channels.linkedin.text}}`
   - **Scheduled at**: `{{channels.linkedin.scheduledAt}}` (optional)
   - **Now**: `false` (create as draft)
6. Add error handling (optional but recommended)

#### Route 2: Facebook

1. Add Route 2 in Router
2. Add Filter: `channels.facebook` exists
3. Add Buffer → Create an Update
4. Map:
   - Profile: Facebook page
   - Text: `{{channels.facebook.text}}`
   - Scheduled at: `{{channels.facebook.scheduledAt}}`
   - Now: `false`

#### Route 3: Instagram

1. Add Route 3 in Router
2. Add Filter: `channels.instagram` exists
3. Add Buffer → Create an Update
4. Map:
   - Profile: Instagram account
   - Text: `{{channels.instagram.text}}` + hashtags
   - Scheduled at: `{{channels.instagram.scheduledAt}}`
   - Now: `false`

**Note**: For Instagram, you may need to format the text to include hashtags:

```
{{channels.instagram.text}}

{{channels.instagram.hashtags join " "}}
```

### 3.8: Activate Scenario

1. Click **"Run once"** to test the scenario
2. If successful, click **"Turn on scenario"** to activate
3. The webhook is now ready to receive requests

### 3.9: Test Webhook

Test the webhook with a sample payload:

```bash
curl -X POST https://hook.us2.make.com/your_webhook_path \
  -H "Content-Type: application/json" \
  -H "x-make-apikey: your_secret_here" \
  -d '{
    "articleId": "test-123",
    "canonicalUrl": "https://example.com/post",
    "channels": {
      "linkedin": {
        "text": "Test LinkedIn post"
      }
    }
  }'
```

Check Make.com execution history to verify the webhook received the data and Buffer updates were created.

### Troubleshooting Make.com

- **Webhook not receiving data**: Check webhook URL is correct and scenario is activated
- **Buffer updates not created**: Verify Buffer account is connected and profile IDs are correct
- **Authentication errors**: Ensure `MAKE_WEBHOOK_SECRET` matches what Make.com expects
- **Router not routing**: Check filter conditions match the payload structure

## Step 4: Medium Publishing (Gemini-Generated Content)

Medium does not have an API and is not supported by Buffer or Make.com. Instead, the system uses Gemini AI to generate Medium-ready content that you can copy and paste directly into Medium's post editor.

### How It Works

1. Click **"Publish to Medium"** in Sanity Studio
2. Gemini AI generates Medium-optimized markdown content
3. Content is saved to the post's Distribution field
4. Copy the generated content and paste it into Medium's editor
5. Publish manually in Medium

### No Additional Setup Required

No API keys or Make.com configuration needed. The Medium content generation uses the same Gemini API key configured in Step 2.

## Step 5: Sanity Write Token

1. Go to [Sanity Manage](https://sanity.io/manage)
2. Select your project
3. Go to **API** → **Tokens**
4. Click **Add API token**
5. Name it "Distribution Write Token"
6. Set permissions to **Editor** (needs write access)
7. Copy the token to `.env.local` as `SANITY_WRITE_TOKEN`

**Important**: Keep this token secure. Never commit it to version control.

## Step 6: Distribution Secret

Generate a secure random string for API authentication:

```bash
# Using OpenSSL
openssl rand -hex 32

# Or using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Add this to both:

- `.env.local` as `DISTRIBUTION_SECRET` (server-side)
- `.env.local` as `NEXT_PUBLIC_DISTRIBUTION_SECRET` (client-side, for Studio)

## Step 7: Deploy Schema Changes

After setting up environment variables, deploy the updated schema to Sanity:

```bash
# If using Sanity CLI
npx sanity deploy

# Or push schema changes through Studio
# The distribution fields will appear in your post documents
```

## Step 8: Test the Setup

1. Start your development server:

   ```bash
   npm run dev
   ```

2. Open Sanity Studio: `http://localhost:3000/studio`

3. Open a post document

4. You should see the Distribution fields in the document

5. Test generation:
   - Click "Generate Newsletter Draft" or "Generate Social Drafts"
   - Check that content appears in the distribution fields

## Troubleshooting

### "SANITY_WRITE_TOKEN is required"

- Make sure you've added the write token to `.env.local`
- Restart your development server after adding environment variables

### "GOOGLE_GEMINI_API_KEY is required"

- Verify your Gemini API key is correct
- Check that it's added to `.env.local` (not `.env`)

### "Rate limit exceeded"

- Wait 1 minute between generation requests for the same post
- Consider upgrading your Gemini API plan

### Make.com webhook fails

- Verify `MAKE_WEBHOOK_URL` is correct and scenario is activated
- Check `MAKE_WEBHOOK_SECRET` matches Make.com configuration
- Review Make.com execution history for error details
- Ensure Buffer account is connected in Make.com
- Verify router filters match the payload structure

### Medium generation fails

- Verify Gemini API key is correctly configured
- Check rate limits (wait 1 minute between generations)
- Review error message in `distribution.medium.error` field
- Ensure post has sufficient content (title, body required)
- Check that `distribution.medium.generatedContent` field exists after generation

## Security Notes

- Never commit `.env.local` to version control
- Rotate `DISTRIBUTION_SECRET` periodically
- Use environment-specific secrets for production
- Consider implementing OAuth for Buffer instead of static tokens

## Next Steps

See [DISTRIBUTION_USAGE.md](./DISTRIBUTION_USAGE.md) for how to use the Distribution feature.
