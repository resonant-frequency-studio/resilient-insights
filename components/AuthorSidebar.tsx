import Image from 'next/image'
import { urlFor } from '@/sanity/lib/image'
import { PortableText } from '@portabletext/react'
import { ArrowRight } from './icons/ArrowRight'
import Typography from './Typography'
import SocialLinks from './SocialLinks'
import { Author } from '@/types/sanity'

interface AuthorSidebarProps {
  author?: Author
}

const AuthorSidebar: React.FC<AuthorSidebarProps> = ({ author }) => {
  if (!author) return null

  return (
    <div className="w-full md:w-80 shrink-0">
      <div>
        <div className="flex items-center gap-3 mb-4">
          {author.image && (
            <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0">
              <Image
                src={urlFor(author.image).width(48).height(48).url()}
                alt={author.name}
                fill
                className="object-cover"
              />
            </div>
          )}
          <Typography as="h2" variant="heading-6" className="uppercase font-semibold">
            ABOUT THE AUTHOR
          </Typography>
        </div>
        
        {author.bio && (
          <div className="text-sm text-foreground-dark mb-6 leading-relaxed">
            <PortableText value={author.bio} />
          </div>
        )}

        {author.slug && (
          <>
            <a
              href="https://resilientleadership.us/about"
              className="inline-flex items-center gap-3 text-foreground-dark font-medium hover:text-button-primary transition-colors group mb-6"
            >
              <div className="w-10 h-10 rounded-full border border-foreground-dark flex items-center justify-center transition-all group-hover:border-button-primary group-hover:bg-button-primary group-hover:text-foreground-light">
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
              <span>LEARN MORE ABOUT {author.name.split(' ')[0].toUpperCase()}</span>
            </a>
            {/* Social Media Icons */}
            <SocialLinks
              linkedin={author.linkedin}
              facebook={author.facebook}
              instagram={author.instagram}
              youtube={author.youtube}
            />
          </>
        )}
      </div>
    </div>
  )
}

export default AuthorSidebar

