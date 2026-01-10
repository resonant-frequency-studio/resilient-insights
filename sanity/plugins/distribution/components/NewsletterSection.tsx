'use client'

import {
  Card,
  Stack,
  Button,
  Text,
  Flex,
  Label,
  TextArea,
  Badge,
} from '@sanity/ui'
import { set, PatchEvent } from 'sanity'

interface NewsletterData {
  title?: string
  subtitle?: string
  body?: string
  ctaText?: string
  ctaUrl?: string
  generatedAt?: string
  model?: string
}

interface NewsletterSectionProps {
  newsletter: NewsletterData
  onChange?: (event: PatchEvent) => void
  onCopy: (text: string) => void
  onGenerate?: () => void
  isGenerating?: boolean
}

export function NewsletterSection({
  newsletter,
  onChange,
  onCopy,
  onGenerate,
  isGenerating,
}: NewsletterSectionProps) {
  // Determine status based on content
  const status = newsletter.body ? 'ready' : 'idle'

  return (
    <Card padding={3} radius={2} tone="transparent" border>
      <Stack space={4}>
        <Flex align="center" justify="space-between">
          <Text size={1} weight="bold">
            Newsletter
          </Text>
          <Flex align="center" gap={2}>
            {!isGenerating && (
              <Badge tone={status === 'ready' ? 'caution' : 'primary'}>
                {status}
              </Badge>
            )}
            {onGenerate && (
              <Button
                type="button"
                text={
                  isGenerating ? 'Generating...' : 'Generate Newsletter Draft'
                }
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

        {newsletter.title !== undefined && (
          <Stack space={2}>
            <Label>Title</Label>
            <TextArea
              value={newsletter.title || ''}
              onChange={e => {
                if (onChange) {
                  onChange(
                    PatchEvent.from(
                      set(e.currentTarget.value, ['newsletter', 'title'])
                    )
                  )
                }
              }}
              rows={2}
            />
            <Flex gap={2}>
              <Button
                text="Copy"
                mode="ghost"
                fontSize={0}
                padding={1}
                onClick={() => onCopy(newsletter.title || '')}
              />
            </Flex>
          </Stack>
        )}

        {newsletter.subtitle !== undefined && (
          <Stack space={2}>
            <Label>Subtitle</Label>
            <TextArea
              value={newsletter.subtitle || ''}
              onChange={e => {
                if (onChange) {
                  onChange(
                    PatchEvent.from(
                      set(e.currentTarget.value, ['newsletter', 'subtitle'])
                    )
                  )
                }
              }}
              rows={2}
            />
            <Flex gap={2}>
              <Button
                text="Copy"
                mode="ghost"
                fontSize={0}
                padding={1}
                onClick={() => onCopy(newsletter.subtitle || '')}
              />
            </Flex>
          </Stack>
        )}

        {newsletter.body !== undefined && (
          <Stack space={2}>
            <Label>Body</Label>
            <TextArea
              value={newsletter.body || ''}
              onChange={e => {
                if (onChange) {
                  onChange(
                    PatchEvent.from(
                      set(e.currentTarget.value, ['newsletter', 'body'])
                    )
                  )
                }
              }}
              rows={6}
            />
            <Flex gap={2}>
              <Button
                text="Copy Body"
                mode="ghost"
                fontSize={0}
                padding={1}
                onClick={() => onCopy(newsletter.body || '')}
              />
            </Flex>
          </Stack>
        )}

        {newsletter.ctaText !== undefined && (
          <Stack space={2}>
            <Label>CTA Text</Label>
            <TextArea
              value={newsletter.ctaText || ''}
              onChange={e => {
                if (onChange) {
                  onChange(
                    PatchEvent.from(
                      set(e.currentTarget.value, ['newsletter', 'ctaText'])
                    )
                  )
                }
              }}
              rows={1}
            />
            <Flex gap={2}>
              <Button
                text="Copy"
                mode="ghost"
                fontSize={0}
                padding={1}
                onClick={() => onCopy(newsletter.ctaText || '')}
              />
            </Flex>
          </Stack>
        )}

        {newsletter.ctaUrl !== undefined && (
          <Stack space={2}>
            <Label muted>CTA URL</Label>
            <TextArea
              value={newsletter.ctaUrl || ''}
              readOnly
              rows={1}
              style={{ opacity: 0.6, cursor: 'default' }}
            />
            <Flex gap={2}>
              <Button
                type="button"
                text="Copy"
                mode="ghost"
                fontSize={0}
                padding={1}
                onClick={() => onCopy(newsletter.ctaUrl || '')}
              />
            </Flex>
          </Stack>
        )}
      </Stack>
    </Card>
  )
}
