import Link from 'next/link'
import Typography from './Typography'
import SocialLinks from './SocialLinks'
import { getMainSiteUrl } from '@/lib/mainSiteUrl'

const Footer = () => {
  const mainSiteUrl = getMainSiteUrl()
  return (
    <footer className="bg-fifth text-foreground-light">
      <div className="max-width-container py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          {/* Company Information - Left */}
          <div className="lg:col-span-1">
            <Typography variant="heading-3" as="h2" className="mb-4 text-foreground-light">
              Resilient Leadership
            </Typography>
            <Typography variant="body-small" as="p" className="text-foreground-light/80">
              Resilient Leadership helps leaders and teams grow through change with greater
              self-awareness, resilience, and effectiveness.
            </Typography>
          </div>

          {/* Services Column */}
          <div>
            <Typography
              variant="nav"
              as="h3"
              className="mb-4 text-foreground-light uppercase tracking-wider"
            >
              What we do
            </Typography>
            <ul className="space-y-3">
              <li>
                <a
                  href={`${mainSiteUrl}/services/executive-coaching`}
                  className="text-foreground-light/80 hover:text-foreground-light transition-colors text-sm"
                >
                  Executive Coaching
                </a>
              </li>
              <li>
                <a
                  href={`${mainSiteUrl}/services/team-coaching`}
                  className="text-foreground-light/80 hover:text-foreground-light transition-colors text-sm"
                >
                  Team Coaching
                </a>
              </li>
              <li>
                <a
                  href={`${mainSiteUrl}/services/change-management`}
                  className="text-foreground-light/80 hover:text-foreground-light transition-colors text-sm"
                >
                  Change Management
                </a>
              </li>
              <li>
                <a
                  href={`${mainSiteUrl}/services/360-feedback`}
                  className="text-foreground-light/80 hover:text-foreground-light transition-colors text-sm"
                >
                  360˚ Feedback
                </a>
              </li>
              <li>
                <a
                  href={`${mainSiteUrl}/services/surveys-assessments`}
                  className="text-foreground-light/80 hover:text-foreground-light transition-colors text-sm"
                >
                  Surveys and Assessments
                </a>
              </li>
              <li>
                <a
                  href={`${mainSiteUrl}/services/custom-engagements`}
                  className="text-foreground-light/80 hover:text-foreground-light transition-colors text-sm"
                >
                  Custom Engagements
                </a>
              </li>
            </ul>
          </div>

          {/* Navigation Column */}
          <div>
            <Typography
              variant="nav"
              as="h3"
              className="mb-4 text-foreground-light uppercase tracking-wider"
            >
              Navigation
            </Typography>
            <ul className="space-y-3">
              <li>
                <a
                  href={mainSiteUrl}
                  className="text-foreground-light/80 hover:text-foreground-light transition-colors text-sm"
                >
                  Home
                </a>
              </li>
              <li>
                <Link
                  href="/"
                  className="text-foreground-light/80 hover:text-foreground-light transition-colors text-sm"
                >
                  Articles
                </Link>
              </li>
              <li>
                <a
                  href={`${mainSiteUrl}/about`}
                  className="text-foreground-light/80 hover:text-foreground-light transition-colors text-sm"
                >
                  About
                </a>
              </li>
              <li>
                <a
                  href={`${mainSiteUrl}/contact`}
                  className="text-foreground-light/80 hover:text-foreground-light transition-colors text-sm"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Legal Column */}
          <div>
            <Typography
              variant="nav"
              as="h3"
              className="mb-4 text-foreground-light uppercase tracking-wider"
            >
              Legal
            </Typography>
            <ul className="space-y-3">
              <li>
                <a
                  href={`${mainSiteUrl}/privacy`}
                  className="text-foreground-light/80 hover:text-foreground-light transition-colors text-sm"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href={`${mainSiteUrl}/cookies`}
                  className="text-foreground-light/80 hover:text-foreground-light transition-colors text-sm"
                >
                  Cookie Policy
                </a>
              </li>
              <li>
                <a
                  href={`${mainSiteUrl}/terms`}
                  className="text-foreground-light/80 hover:text-foreground-light transition-colors text-sm"
                >
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 pt-8 border-t border-foreground-light/20">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            {/* Social Media Icons */}
            <SocialLinks
              linkedin="https://www.linkedin.com/in/charlene-e-wilson-m-a-acc-8114283"
              facebook="https://www.facebook.com/resilientleadershipcoaching"
              instagram="https://www.instagram.com/resilient.leadership.us/"
              youtube="https://www.youtube.com/@resilientleadership"
              iconClassName="border-foreground-light/30 bg-transparent text-foreground-light/80 hover:border-foreground-light hover:text-foreground-light"
            />

            {/* Copyright */}
            <Typography variant="body-small" as="p" className="text-foreground-light/60">
              © {new Date().getFullYear()} Resilient Leadership. All rights reserved.
            </Typography>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
