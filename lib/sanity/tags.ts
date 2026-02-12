export const SANITY_POSTS_TAG = 'sanity:posts'

export function getSanityPostTag(slug: string) {
  return `sanity:post:${slug}`
}
