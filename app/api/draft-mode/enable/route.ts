import { defineEnableDraftMode } from 'next-sanity/draft-mode'
import { client } from '@/sanity/lib/client'

const previewToken = process.env.SANITY_API_READ_TOKEN

export const { GET } = defineEnableDraftMode({
  client: previewToken ? client.withConfig({ token: previewToken }) : client,
})
