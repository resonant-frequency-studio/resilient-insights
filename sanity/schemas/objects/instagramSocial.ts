import { defineType, defineField } from 'sanity'
import { SocialImageInput } from '../../components/SocialImageInput'
import { InstagramSocialInput } from '../../components/InstagramSocialInput'

export const instagramSocial = defineType({
  name: 'instagramSocial',
  title: 'Instagram',
  type: 'object',
  options: {
    canvasApp: { exclude: true },
  },
  components: {
    input: InstagramSocialInput,
  },
  fields: [
    defineField({
      name: 'caption',
      title: 'Caption',
      type: 'array',
      of: [{ type: 'block' }],
    }),
    defineField({
      name: 'image',
      title: 'Image (optional)',
      type: 'image',
      options: {
        hotspot: true,
      },
      components: {
        input: SocialImageInput,
      },
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alternative Text',
          description: 'Optional description for accessibility',
          hidden: true,
        },
      ],
    }),
    defineField({
      name: 'hashtags',
      title: 'Hashtags',
      type: 'array',
      of: [{ type: 'string' }],
    }),
  ],
})
