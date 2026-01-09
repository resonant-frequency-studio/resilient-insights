import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './schemas'
import { distributionPlugin } from './plugins/distribution'

export default defineConfig({
  name: 'default',
  title: 'Resilient Insights',

  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',

  basePath: '/studio',

  plugins: [structureTool(), visionTool(), distributionPlugin()],

  schema: {
    types: schemaTypes,
  },
})
