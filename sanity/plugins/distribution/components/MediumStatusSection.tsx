'use client'

import {
  Card,
  Stack,
  Button,
  Text,
  Flex,
  Badge,
  Label,
  TextArea,
} from '@sanity/ui'

interface MediumData {
  status?: 'idle' | 'ready' | 'error'
  canonicalUrl?: string
  generatedContent?: string
  title?: string
  subtitle?: string
  tags?: string[]
  generatedAt?: string
  error?: string
}

interface MediumStatusSectionProps {
  medium?: MediumData
  onCopy: (text: string) => void
  onGenerate?: () => void
  isGenerating?: boolean
}

function getStatusBadge(status?: string) {
  const colors: Record<
    string,
    'positive' | 'caution' | 'critical' | 'primary'
  > = {
    idle: 'primary',
    ready: 'caution',
    error: 'critical',
  }
  return (
    <Badge tone={colors[status || 'idle'] || 'primary'}>
      {status || 'idle'}
    </Badge>
  )
}

export function MediumStatusSection({
  medium,
  onCopy,
  onGenerate,
  isGenerating,
}: MediumStatusSectionProps) {
  return (
    <Card padding={3} radius={2} tone="transparent" border>
      <Stack space={4}>
        <Flex align="center" justify="space-between">
          <Text size={1} weight="bold">
            Medium Draft
          </Text>
          <Flex align="center" gap={2}>
            {medium?.status && getStatusBadge(medium.status)}
            {onGenerate && (
              <Button
                type="button"
                text={isGenerating ? 'Generating...' : 'Generate Medium Draft'}
                mode="ghost"
                tone="primary"
                fontSize={0}
                padding={2}
                onClick={onGenerate}
                disabled={isGenerating}
              />
            )}
          </Flex>
        </Flex>

        {medium?.generatedAt && (
          <Text size={0} muted>
            Generated: {new Date(medium.generatedAt).toLocaleString()}
          </Text>
        )}

        {medium?.title && (
          <Stack space={2}>
            <Label>Title</Label>
            <Text size={1} weight="semibold">
              {medium.title}
            </Text>
            <Button
              type="button"
              text="Copy Title"
              mode="ghost"
              fontSize={0}
              padding={1}
              onClick={() => onCopy(medium.title || '')}
            />
          </Stack>
        )}

        {medium?.subtitle && (
          <Stack space={2}>
            <Label>Subtitle</Label>
            <Text size={1} muted>
              {medium.subtitle}
            </Text>
            <Button
              type="button"
              text="Copy Subtitle"
              mode="ghost"
              fontSize={0}
              padding={1}
              onClick={() => onCopy(medium.subtitle || '')}
            />
          </Stack>
        )}

        {medium?.tags && medium.tags.length > 0 && (
          <Stack space={2}>
            <Label>Tags</Label>
            <Text size={1}>{medium.tags.join(', ')}</Text>
            <Button
              type="button"
              text="Copy Tags"
              mode="ghost"
              fontSize={0}
              padding={1}
              onClick={() => onCopy(medium.tags?.join(', ') || '')}
            />
          </Stack>
        )}

        {medium?.generatedContent && medium?.status === 'ready' && (
          <Stack space={2}>
            <Label>Medium-Ready Content (Copy &amp; Paste into Medium Editor)</Label>
            <Text size={0} muted>
              Copy the content below and paste it into Medium&apos;s post
              editor. The content is formatted and ready to use.
            </Text>
            <TextArea
              value={medium.generatedContent}
              readOnly
              rows={20}
              style={{ opacity: 0.8, cursor: 'default' }}
            />
            <Stack space={2}>
              <Button
                type="button"
                text="Copy Full Content to Clipboard"
                tone="primary"
                mode="default"
                fontSize={1}
                padding={2}
                onClick={() => onCopy(medium.generatedContent || '')}
              />
              <Text size={0} muted>
                After copying, go to{' '}
                <a
                  href="https://medium.com/new-story"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Medium&apos;s new story page
                </a>{' '}
                and paste the content.
              </Text>
            </Stack>
          </Stack>
        )}

        {medium?.error && (
          <Text size={0} style={{ color: '#721c24' }}>
            Error: {medium.error}
          </Text>
        )}
      </Stack>
    </Card>
  )
}
