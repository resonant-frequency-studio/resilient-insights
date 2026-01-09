'use client'

import { Box, Text, Spinner, Flex } from '@sanity/ui'

interface StatusMessagesProps {
  loading?: string | null
  error?: string | null
  success?: string | null
}

export function StatusMessages({
  loading,
  error,
  success,
}: StatusMessagesProps) {
  return (
    <>
      {/* Loading State */}
      {loading && (
        <Box padding={3}>
          <Flex align="center" gap={2}>
            <Spinner />
            <Text size={1}>{loading}</Text>
          </Flex>
        </Box>
      )}

      {/* Success Message */}
      {success && (
        <Box padding={3} style={{ background: '#d4edda', borderRadius: '4px' }}>
          <Text size={1} style={{ color: '#155724' }}>
            {success}
          </Text>
        </Box>
      )}

      {/* Error Message */}
      {error && (
        <Box padding={3} style={{ background: '#f8d7da', borderRadius: '4px' }}>
          <Text size={1} style={{ color: '#721c24' }}>
            {error}
          </Text>
        </Box>
      )}
    </>
  )
}
