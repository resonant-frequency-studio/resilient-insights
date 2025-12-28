import { groq } from 'next-sanity'

export const postsQuery = groq`*[_type == "post"] | order(publishedAt desc) {
  _id,
  title,
  slug,
  publishedAt,
  excerpt,
  mainImage,
  author->{
    name,
    image,
    slug
  },
  categories[]->{
    title,
    slug
  }
}`

export const postBySlugQuery = groq`*[_type == "post" && slug.current == $slug][0] {
  _id,
  title,
  slug,
  publishedAt,
  excerpt,
  mainImage,
  body,
  author->{
    name,
    image,
    slug,
    bio
  },
  categories[]->{
    title,
    slug
  }
}`

export const postSlugsQuery = groq`*[_type == "post"] {
  slug
}`

