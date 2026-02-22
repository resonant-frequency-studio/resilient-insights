import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import {
  defineDocuments,
  defineLocations,
  presentationTool,
} from 'sanity/presentation'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './schemas'
import { structure } from './structure'
// import { manageSocialPlugin } from './plugins/managePosts'

const locations = {
  post: defineLocations({
    select: { title: 'title', slug: 'slug.current' },
    resolve: doc => {
      const slug = doc?.slug
      if (!slug) {
        return {
          locations: [{ title: 'Articles', href: '/' }],
        }
      }

      return {
        locations: [
          { title: doc.title || 'Untitled post', href: `/${slug}` },
          { title: 'Articles', href: '/' },
        ],
      }
    },
  }),
}

const mainDocuments = defineDocuments([
  {
    route: '/:slug',
    filter: `_type == "post" && slug.current == $slug`,
  },
])

export default defineConfig({
  name: 'default',
  title: 'Resilient Insights',

  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',

  basePath: '/studio',

  plugins: [
    structureTool({ structure }),
    visionTool(),
    presentationTool({
      resolve: { locations, mainDocuments },
      previewUrl: {
        initial:
          process.env.NODE_ENV === 'development'
            ? 'http://localhost:3000'
            : process.env.SITE_BASE_URL || 'http://localhost:3000',
        previewMode: {
          enable: '/api/draft-mode/enable',
          disable: '/api/draft-mode/disable',
        },
      },
      allowOrigins: [
        'http://localhost:*',
        ...(process.env.SITE_BASE_URL ? [process.env.SITE_BASE_URL] : []),
      ],
    }),
  ],

  schema: {
    types: schemaTypes,
  },
})
