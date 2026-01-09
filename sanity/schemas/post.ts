import { defineField, defineType } from 'sanity'
import { DistributionTool } from '../plugins/distribution/DistributionTool'
import { SocialInput } from '../components/SocialInput'
import { NewsletterInput } from '../components/NewsletterInput'
import { MediumInput } from '../components/MediumInput'
// These imports are used in the schema type references (lines 148, 153, 158)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { linkedinSocial } from './objects/linkedinSocial'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { facebookSocial } from './objects/facebookSocial'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { instagramSocial } from './objects/instagramSocial'

export default defineType({
  name: 'post',
  title: 'Post',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'reference',
      to: { type: 'author' },
    }),
    defineField({
      name: 'mainImage',
      title: 'Main image',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'categories',
      title: 'Categories',
      type: 'array',
      of: [{ type: 'reference', to: { type: 'category' } }],
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published at',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      rows: 4,
      description: 'A short description of the post',
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [
        {
          type: 'block',
        },
        {
          type: 'image',
          fields: [
            {
              name: 'alt',
              type: 'string',
              title: 'Alternative Text',
            },
          ],
        },
      ],
    }),
    defineField({
      name: 'publishedUrl',
      title: 'Published URL',
      type: 'url',
      description: 'The canonical URL for this post (computed from slug)',
      readOnly: true,
    }),
    defineField({
      name: 'distribution',
      title: 'Distribution',
      type: 'object',
      components: {
        input: DistributionTool,
      },
      fields: [
        {
          name: 'newsletter',
          title: 'Newsletter',
          type: 'object',
          components: {
            input: NewsletterInput,
          },
          fields: [
            {
              name: 'subject',
              title: 'Subject',
              type: 'string',
            },
            {
              name: 'preheader',
              title: 'Preheader',
              type: 'string',
            },
            {
              name: 'body',
              title: 'Body',
              type: 'array',
              of: [{ type: 'block' }],
            },
            {
              name: 'ctaText',
              title: 'CTA Text',
              type: 'string',
            },
            {
              name: 'ctaUrl',
              title: 'CTA URL',
              type: 'url',
            },
            {
              name: 'generatedAt',
              title: 'Generated At',
              type: 'datetime',
              readOnly: true,
              hidden: true,
            },
            {
              name: 'model',
              title: 'Model',
              type: 'string',
              readOnly: true,
              hidden: true,
            },
          ],
        },
        {
          name: 'social',
          title: 'Social Media',
          type: 'object',
          components: {
            input: SocialInput,
          },
          fields: [
            {
              name: 'linkedin',
              title: 'LinkedIn',
              type: 'linkedinSocial',
            },
            {
              name: 'facebook',
              title: 'Facebook',
              type: 'facebookSocial',
            },
            {
              name: 'instagram',
              title: 'Instagram',
              type: 'instagramSocial',
            },
            {
              name: 'suggestedFirstComment',
              title: 'Suggested First Comment',
              type: 'text',
              rows: 3,
            },
            {
              name: 'generatedAt',
              title: 'Generated At',
              type: 'datetime',
              readOnly: true,
              hidden: true,
            },
            {
              name: 'model',
              title: 'Model',
              type: 'string',
              readOnly: true,
              hidden: true,
            },
          ],
        },
        {
          name: 'medium',
          title: 'Medium',
          type: 'object',
          components: {
            input: MediumInput,
          },
          fields: [
            {
              name: 'status',
              title: 'Status',
              type: 'string',
              hidden: true,
              options: {
                list: [
                  { title: 'Idle', value: 'idle' },
                  { title: 'Ready', value: 'ready' },
                  { title: 'Error', value: 'error' },
                ],
              },
              initialValue: 'idle',
            },
            {
              name: 'title',
              title: 'Medium Title',
              type: 'string',
              description: 'Title optimized for Medium',
            },
            {
              name: 'subtitle',
              title: 'Medium Subtitle',
              type: 'string',
              description: 'Optional subtitle for Medium',
            },
            {
              name: 'generatedContent',
              title: 'Generated Content',
              type: 'array',
              of: [{ type: 'block' }],
              description:
                'Medium-ready content - copy and paste into Medium editor',
            },
            {
              name: 'tags',
              title: 'Medium Tags',
              type: 'array',
              of: [{ type: 'string' }],
              description: 'Tags for Medium (comma-separated when copying)',
            },
            {
              name: 'canonicalUrl',
              title: 'Canonical URL',
              type: 'url',
              hidden: true,
            },
            {
              name: 'generatedAt',
              title: 'Generated At',
              type: 'datetime',
              hidden: true,
            },
            {
              name: 'error',
              title: 'Error',
              type: 'text',
              hidden: true,
            },
          ],
        },
        {
          name: 'scheduledPosts',
          title: 'Scheduled Posts',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                {
                  name: 'channel',
                  title: 'Channel',
                  type: 'string',
                  options: {
                    list: [
                      { title: 'LinkedIn', value: 'linkedin' },
                      { title: 'Facebook', value: 'facebook' },
                      { title: 'Instagram', value: 'instagram' },
                    ],
                  },
                  validation: Rule => Rule.required(),
                },
                {
                  name: 'content',
                  title: 'Content',
                  type: 'text',
                  description: 'Generated post content',
                  validation: Rule => Rule.required(),
                },
                {
                  name: 'scheduledAt',
                  title: 'Scheduled At',
                  type: 'datetime',
                  description: 'When to publish this post',
                  validation: Rule => Rule.required(),
                },
                {
                  name: 'status',
                  title: 'Status',
                  type: 'string',
                  options: {
                    list: [
                      { title: 'Scheduled', value: 'scheduled' },
                      { title: 'Published', value: 'published' },
                      { title: 'Failed', value: 'failed' },
                    ],
                  },
                  initialValue: 'scheduled',
                },
                {
                  name: 'platformPostId',
                  title: 'Platform Post ID',
                  type: 'string',
                  description:
                    'Post ID from LinkedIn/Facebook/Instagram after publishing',
                },
                {
                  name: 'error',
                  title: 'Error',
                  type: 'text',
                  description: 'Error message if publishing failed',
                },
                {
                  name: 'publishedAt',
                  title: 'Published At',
                  type: 'datetime',
                  description: 'When the post was actually published',
                },
                {
                  name: 'image',
                  title: 'Image',
                  type: 'image',
                  description:
                    'Optional image to include with the post (from Sanity assets)',
                  options: {
                    hotspot: true,
                  },
                },
                {
                  name: 'imageUrl',
                  title: 'Image URL',
                  type: 'url',
                  description:
                    'Optional external image URL (if not using Sanity image)',
                },
              ],
            },
          ],
        },
        {
          name: 'socialAccounts',
          title: 'Social Media Accounts',
          type: 'object',
          fields: [
            {
              name: 'linkedin',
              title: 'LinkedIn',
              type: 'object',
              fields: [
                {
                  name: 'accessToken',
                  title: 'Access Token',
                  type: 'string',
                  description: 'OAuth access token (stored securely)',
                  hidden: true,
                },
                {
                  name: 'refreshToken',
                  title: 'Refresh Token',
                  type: 'string',
                  description: 'OAuth refresh token',
                  hidden: true,
                },
                {
                  name: 'expiresAt',
                  title: 'Expires At',
                  type: 'datetime',
                  description: 'When the access token expires',
                  hidden: true,
                },
                {
                  name: 'profileId',
                  title: 'Profile ID',
                  type: 'string',
                  description: 'LinkedIn user/profile ID',
                  hidden: true,
                },
                {
                  name: 'connectedAt',
                  title: 'Connected At',
                  type: 'datetime',
                  description: 'When the account was connected',
                  readOnly: true,
                },
              ],
            },
            {
              name: 'facebook',
              title: 'Facebook',
              type: 'object',
              fields: [
                {
                  name: 'accessToken',
                  title: 'Access Token',
                  type: 'string',
                  hidden: true,
                },
                {
                  name: 'refreshToken',
                  title: 'Refresh Token',
                  type: 'string',
                  hidden: true,
                },
                {
                  name: 'expiresAt',
                  title: 'Expires At',
                  type: 'datetime',
                  hidden: true,
                },
                {
                  name: 'pageId',
                  title: 'Page ID',
                  type: 'string',
                  hidden: true,
                },
                {
                  name: 'connectedAt',
                  title: 'Connected At',
                  type: 'datetime',
                  readOnly: true,
                },
              ],
            },
            {
              name: 'instagram',
              title: 'Instagram',
              type: 'object',
              fields: [
                {
                  name: 'accessToken',
                  title: 'Access Token',
                  type: 'string',
                  hidden: true,
                },
                {
                  name: 'refreshToken',
                  title: 'Refresh Token',
                  type: 'string',
                  hidden: true,
                },
                {
                  name: 'expiresAt',
                  title: 'Expires At',
                  type: 'datetime',
                  hidden: true,
                },
                {
                  name: 'accountId',
                  title: 'Account ID',
                  type: 'string',
                  hidden: true,
                },
                {
                  name: 'connectedAt',
                  title: 'Connected At',
                  type: 'datetime',
                  readOnly: true,
                },
              ],
            },
          ],
        },
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      author: 'author.name',
      media: 'mainImage',
    },
    prepare(selection) {
      const { author } = selection
      return { ...selection, subtitle: author && `by ${author}` }
    },
  },
})
