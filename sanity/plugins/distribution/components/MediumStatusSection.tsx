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
import { PatchEvent, set } from 'sanity'

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
  onChange?: (event: PatchEvent) => void
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
  onChange,
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

        {/* Title */}
        <Stack space={2}>
          <Label>Title</Label>
          <TextArea
            value={medium?.title || ''}
            onChange={e => {
              if (onChange) {
                onChange(
                  PatchEvent.from(
                    set(e.currentTarget.value, ['medium', 'title'])
                  )
                )
              }
            }}
            rows={2}
          />
          <Flex gap={2}>
            <Button
              type="button"
              text="Copy Title"
              mode="ghost"
              fontSize={0}
              padding={1}
              onClick={() => onCopy(medium?.title || '')}
            />
          </Flex>
        </Stack>

        {/* Subtitle */}
        <Stack space={2}>
          <Label>Subtitle</Label>
          <TextArea
            value={medium?.subtitle || ''}
            onChange={e => {
              if (onChange) {
                onChange(
                  PatchEvent.from(
                    set(e.currentTarget.value, ['medium', 'subtitle'])
                  )
                )
              }
            }}
            rows={2}
          />
          <Flex gap={2}>
            <Button
              type="button"
              text="Copy Subtitle"
              mode="ghost"
              fontSize={0}
              padding={1}
              onClick={() => onCopy(medium?.subtitle || '')}
            />
          </Flex>
        </Stack>

        {/* Tags */}
        <Stack space={2}>
          <Label>Tags</Label>
          <TextArea
            value={medium?.tags?.join(', ') || ''}
            onChange={e => {
              if (onChange) {
                const tags = e.currentTarget.value
                  .split(',')
                  .map(t => t.trim())
                  .filter(Boolean)
                onChange(PatchEvent.from(set(tags, ['medium', 'tags'])))
              }
            }}
            rows={1}
          />
          <Flex gap={2}>
            <Button
              type="button"
              text="Copy Tags"
              mode="ghost"
              fontSize={0}
              padding={1}
              onClick={() => onCopy(medium?.tags?.join(', ') || '')}
            />
          </Flex>
        </Stack>

        {/* Content */}
        <Stack space={2}>
          <Label>Body</Label>
          <TextArea
            value={medium?.generatedContent || ''}
            onChange={e => {
              if (onChange) {
                onChange(
                  PatchEvent.from(
                    set(e.currentTarget.value, ['medium', 'generatedContent'])
                  )
                )
              }
            }}
            rows={20}
          />
          <Flex gap={2}>
            <Button
              type="button"
              text="Copy Full Content"
              mode="ghost"
              fontSize={0}
              padding={1}
              onClick={() => onCopy(medium?.generatedContent || '')}
            />
          </Flex>
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

        {medium?.error && (
          <Text size={0} style={{ color: '#721c24' }}>
            Error: {medium.error}
          </Text>
        )}
      </Stack>
    </Card>
  )
}
