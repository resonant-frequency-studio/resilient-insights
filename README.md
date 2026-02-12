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

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Sanity Documentation](https://www.sanity.io/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## License

MIT
