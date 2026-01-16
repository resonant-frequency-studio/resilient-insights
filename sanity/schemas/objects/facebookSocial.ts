import { defineType, defineField } from 'sanity'
import { SocialImageInput } from '../../components/SocialImageInput'
import { FacebookSocialInput } from '../../components/FacebookSocialInput'

export const facebookSocial = defineType({
  name: 'facebookSocial',
  title: 'Facebook',
  type: 'object',
  components: {
    input: FacebookSocialInput,
  },
  fields: [
    defineField({
      name: 'text',
      title: 'Text',
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
        },
      ],
    }),
  ],
})
