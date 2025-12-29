import React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { LinkedIn } from './icons/LinkedIn'
import { Facebook } from './icons/Facebook'
import { Instagram } from './icons/Instagram'
import { YouTube } from './icons/YouTube'

export interface SocialLinksProps {
  linkedin?: string
  facebook?: string
  instagram?: string
  youtube?: string
  className?: string
  iconClassName?: string
}

const SocialLinks: React.FC<SocialLinksProps> = ({
  linkedin,
  facebook,
  instagram,
  youtube,
  className,
  iconClassName,
}) => {
  const links = [
    { url: youtube, icon: YouTube, label: 'YouTube', key: 'youtube' },
    { url: instagram, icon: Instagram, label: 'Instagram', key: 'instagram' },
    { url: facebook, icon: Facebook, label: 'Facebook', key: 'facebook' },
    { url: linkedin, icon: LinkedIn, label: 'LinkedIn', key: 'linkedin' },
  ].filter(link => link.url) // Only include links that have URLs

  if (links.length === 0) return null

  return (
    <div className={cn('flex gap-3', className)}>
      {links.map(({ url, icon: Icon, label, key }) => (
        <Link
          key={key}
          href={url!}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'w-10 h-10 rounded-full border border-checkbox-border bg-main',
            'flex items-center justify-center',
            'text-foreground-dark',
            'hover:border-foreground-dark hover:text-button-primary',
            'transition-all duration-200',
            iconClassName
          )}
          aria-label={label}
        >
          <Icon className="w-5 h-5" />
        </Link>
      ))}
    </div>
  )
}

export default SocialLinks
