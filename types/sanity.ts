import { PortableTextBlock } from '@sanity/types'
import { SanityImageSource } from '@sanity/image-url/lib/types/types'

export interface Author {
  _id: string
  name: string
  slug: {
    current: string
  }
  image?: SanityImageSource
  bio?: PortableTextBlock[]
  linkedin?: string
  facebook?: string
  instagram?: string
  youtube?: string
}

export interface Category {
  _id: string
  title: string
  slug: {
    current: string
  }
  description?: string
}

export interface Post {
  _id: string
  title: string
  slug: {
    current: string
  }
  publishedAt: string
  _updatedAt?: string
  excerpt?: string
  mainImage?: SanityImageSource
  body?: PortableTextBlock[]
  author?: Author
  categories?: Category[]
}

