import { defineField, defineType } from 'sanity'
import { NewsletterInput } from '../components/NewsletterInput'
import { MediumInput } from '../components/MediumInput'
import { SocialInput } from '../components/SocialInput'

export default defineType({
  name: 'postDistribution',
  title: 'Post Distribution',
  type: 'document',
  // Hide from the main document list - managed via Manage Social plugin
  liveEdit: true,
  fields: [
    defineField({
      name: 'post',
      title: 'Post',
      type: 'reference',
      to: [{ type: 'post' }],
      validation: Rule => Rule.required(),
      // Make read-only once set - the reference shouldn't change
      readOnly: ({ document }) => !!document?.post,
    }),
    defineField({
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
          title: 'Title',
          type: 'string',
        },
        {
          name: 'subtitle',
          title: 'Subtitle',
          type: 'string',
        },
        {
          name: 'body',
          title: 'Body',
          type: 'array',
          of: [{ type: 'block' }],
        },
        {
          name: 'tags',
          title: 'Tags',
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
    }),
    defineField({
      name: 'newsletter',
      title: 'Newsletter',
      type: 'object',
      components: {
        input: NewsletterInput,
      },
      fields: [
        {
          name: 'title',
          title: 'Title',
          type: 'string',
        },
        {
          name: 'subtitle',
          title: 'Subtitle',
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
          readOnly: true,
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
    }),
    defineField({
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
    }),
    defineField({
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
    }),
    defineField({
      name: 'socialAccounts',
      title: 'Social Media Accounts',
      type: 'object',
      // Hidden from form UI - managed via three-dot menu in Manage Social plugin
      hidden: true,
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
    }),
  ],
  preview: {
    select: {
      title: 'post.title',
      media: 'post.mainImage',
    },
    prepare(selection) {
      return {
        title: selection.title || 'Untitled Post Distribution',
        media: selection.media,
      }
    },
  },
})
