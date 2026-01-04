import type { Metadata } from 'next'
import Link from 'next/link'
import Typography from '@/components/Typography'
import Button from '@/components/Button'
import { Pill } from '@/components'

export const metadata: Metadata = {
  title: 'Page Not Found | Resilient Leadership',
  description:
    'The page you are looking for could not be found. Return to Resilient Leadership homepage or explore our coaching services.',
}

export default function NotFound() {
  return (
    <section className="min-h-screen bg-main pt-32 pb-16 md:py-32">
      <div className="max-width-container">
        <div className="max-w-3xl mx-auto text-center">
          <Pill>404</Pill>

          <Typography variant="heading-2" as="h1" className="mt-6 mb-6">
            Page Not Found
          </Typography>

          <Typography variant="body-large" as="p" className="text-foreground-dark/80 mb-12">
            We couldn&apos;t find the page you&apos;re looking for. It may have been moved, deleted,
            or the URL might be incorrect.
          </Typography>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Button variant="primary" size="lg" href="/">
              Go to Homepage
            </Button>
            <Button variant="outline" size="lg" href="/contact">
              Contact Us
            </Button>
          </div>

          <div className="w-full h-px bg-foreground-dark/20 my-8" />

          <div className="text-left">
            <Typography variant="heading-4" as="h2" className="mb-6">
              Popular Pages
            </Typography>
            <ul className="flex flex-col gap-4">
              <li>
                <Link
                  href="/services"
                  className="text-foreground-dark/80 hover:text-foreground-dark transition-colors underline hover:no-underline"
                >
                  <Typography variant="body" as="span">
                    What We Do
                  </Typography>
                </Link>
              </li>
              <li>
                <Link
                  href="/services/executive-coaching"
                  className="text-foreground-dark/80 hover:text-foreground-dark transition-colors underline hover:no-underline"
                >
                  <Typography variant="body" as="span">
                    Executive Coaching
                  </Typography>
                </Link>
              </li>
              <li>
                <Link
                  href="/services/team-coaching"
                  className="text-foreground-dark/80 hover:text-foreground-dark transition-colors underline hover:no-underline"
                >
                  <Typography variant="body" as="span">
                    Team Coaching
                  </Typography>
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-foreground-dark/80 hover:text-foreground-dark transition-colors underline hover:no-underline"
                >
                  <Typography variant="body" as="span">
                    About Us
                  </Typography>
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-foreground-dark/80 hover:text-foreground-dark transition-colors underline hover:no-underline"
                >
                  <Typography variant="body" as="span">
                    Contact
                  </Typography>
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
