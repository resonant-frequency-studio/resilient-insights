# Resilient Insights

A modern blog built with Next.js 16, TypeScript, Tailwind CSS, and Sanity CMS.

## Features

- 🚀 Next.js 16 with App Router
- ⚛️ React 19
- 📝 Sanity CMS for content management
- 🎨 Tailwind CSS for styling
- 📱 Fully responsive design
- 🔍 TypeScript for type safety
- 🖼️ Image optimization with Next.js Image component

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Sanity account (sign up at [sanity.io](https://www.sanity.io))

### Installation

1. Clone the repository:

```bash
git clone <your-repo-url>
cd resilient-insights
```

2. Install dependencies:

```bash
npm install
```

3. Set up Sanity:
   - Create a new project at [sanity.io/manage](https://www.sanity.io/manage)
   - Copy your Project ID and Dataset name

4. Configure environment variables:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your Sanity credentials:

```
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_REVALIDATE_SECRET=your_random_webhook_secret
```

5. Run the development server:

```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

7. Access Sanity Studio at [http://localhost:3000/studio](http://localhost:3000/studio) to start creating content.

## Keep Homepage Fresh After Publish

To make newly published articles appear quickly on `/`, configure a Sanity webhook:

1. In Sanity project settings, create a webhook that targets:
   - `https://your-domain.com/api/revalidate`
2. Set trigger events to include create, update, and delete for these document types:
   - `post`, `author`, and `category`
3. Add a projection payload that includes the type and slug:

```json
{
  "_type": _type,
  "slug": slug.current
}
```

4. Set the webhook secret to match `SANITY_REVALIDATE_SECRET`.

The app also uses short ISR on the homepage as a fallback, but the webhook gives near-immediate cache invalidation when content changes.

## Sanity Dashboard (Studio embedded in Next.js)

To have this studio appear in the [Sanity Dashboard](https://www.sanity.io/docs/dashboard/dashboard-configure) and work with Canvas/content mapping:

1. **Bridge script**  
   The app already includes the dashboard bridge script in [`app/studio/layout.tsx`](app/studio/layout.tsx).

2. **Authentication for schema deploy**  
   `npm run studio:schema` writes the schema to the Sanity API, so the CLI must be authenticated:
   - **Local:** From the project root, run `cd sanity && npx sanity login` and sign in. After that, `npm run studio:schema` will use the stored session.
   - **CI / token:** Set `SANITY_AUTH_TOKEN` to a token with write access (create one under [Sanity Manage](https://www.sanity.io/manage) → your project → **API** → **Tokens**). If it’s in `.env.local`, the existing script will pick it up; otherwise run `SANITY_AUTH_TOKEN=<token> npm run studio:schema`.

3. **Generate manifest and deploy schema**  
   From the project root, with `NEXT_PUBLIC_SANITY_PROJECT_ID` and `NEXT_PUBLIC_SANITY_DATASET` set (e.g. in `.env.local`):
   - **Manifest only** (so the Dashboard can load studio config):  
     `npm run studio:manifest`  
     This writes manifest files to `public/studio/static/`. Next.js serves them at `/studio/static/` when deployed.
   - **Schema + manifest** (deploy schema to Sanity and update manifest):  
     `npm run studio:schema`  
     Requires authentication (see step 2).

4. **Register the studio URL**  
   In [Sanity Manage](https://www.sanity.io/manage) → your project → **Studios**, add the full URL to this app’s studio, including the path (e.g. `https://your-domain.com/studio`).

5. **Deploy**  
   Deploy the Next.js app so the manifest is available at `https://your-domain.com/studio/static/` and the bridge script is loaded. Optionally run `studio:manifest` or `studio:schema` in your build step so the manifest stays in sync with your schema.

**If Canvas shows "Unable to find any deployed studios":**

- **Studio URL must be registered:** In [Sanity Manage](https://www.sanity.io/manage) → select your project → open the **Studios** (or **API**) area and add your **production** studio URL, including the path (e.g. `https://articles.resilientleadership.us/studio`). Canvas discovers studios from this list; if the URL is missing or wrong, it will show "Not connected."
- **Must be a public URL:** Canvas runs on Sanity’s side and cannot use `http://localhost:...`. The app must be deployed (e.g. Vercel) and the manifest must be reachable at `https://<your-domain>/studio/static/create-manifest.json` without auth.
- **Manifest on the server:** Ensure `public/studio/static/` (with `create-manifest.json`) is part of your deployed build. If you only run `studio:manifest` locally and don’t commit or build with those files, production won’t serve them.

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── blog/              # Blog pages
│   ├── studio/            # Sanity Studio route
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
├── lib/                   # Utility functions
│   └── sanity/           # Sanity queries
├── sanity/                 # Sanity configuration
│   ├── schemas/          # Content schemas
│   └── lib/              # Sanity utilities
├── types/                 # TypeScript type definitions
└── public/                # Static assets
```

## Content Schemas

The project includes three main content types:

- **Post**: Blog posts with title, content, images, author, and categories
- **Author**: Author information with name, image, and bio
- **Category**: Categories for organizing posts

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run studio:manifest` - Extract Sanity Studio manifest to `public/studio/static/` (for Dashboard)
- `npm run studio:schema` - Deploy schema to Sanity and update manifest (requires env vars; use `SANITY_AUTH_TOKEN` in CI)

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Sanity Documentation](https://www.sanity.io/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## License

MIT
