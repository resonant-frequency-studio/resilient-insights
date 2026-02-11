'use client'

import { definePlugin } from 'sanity'
import { ShareIcon } from '@sanity/icons'
import { ManagePostsTool } from './ManagePostsTool'

export const manageSocialPlugin = definePlugin({
  name: 'manage-social',
  tools: [
    {
      title: 'Manage Social',
      name: 'manage-social',
      icon: ShareIcon,
      component: ManagePostsTool,
    },
  ],
})
