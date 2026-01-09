import { defineType, defineField } from 'sanity'
import { SocialImageInput } from '../../components/SocialImageInput'
import { LinkedInSocialInput } from '../../components/LinkedInSocialInput'

export const linkedinSocial = defineType({
  name: 'linkedinSocial',
  title: 'LinkedIn',
  type: 'object',
  components: {
    input: LinkedInSocialInput,
  },
  fields: [
    defineField({
      name: 'text',
      title: 'Text',
      type: 'text',
      rows: 6,
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
