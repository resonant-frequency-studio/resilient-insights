/**
 * CLI-only config so `sanity schema deploy` and other CLI commands
 * have api.projectId / api.dataset when run from this directory.
 * Required for schema deploy; see https://www.sanity.io/docs/cli-reference/cli-config
 */
const config = {
  api: {
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '',
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  },
}

export default config
