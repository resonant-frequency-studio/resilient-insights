'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import Button from './Button'
import MenuButton from './MenuButton'
import Typography from './Typography'

const Header = () => {
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobileMenuOpen])

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY

      // Show header when scrolling up, hide when scrolling down (desktop only)
      if (window.innerWidth >= 768) {
        if (currentScrollY < lastScrollY || currentScrollY < 10) {
          setIsVisible(true)
        } else if (currentScrollY > lastScrollY && currentScrollY > 10) {
          setIsVisible(false)
        }
      }

      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  // Determine Articles link based on environment
  const getArticlesLink = () => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname
      if (hostname === 'staging.resilientleadership.us') {
        return 'https://staging.resilientleadership.us'
      } else if (hostname === 'articles.resilientleadership.us') {
        return 'https://articles.resilientleadership.us'
      }
    }
    // Local development
    return '/'
  }

  const articlesLink = getArticlesLink()

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const handleNavLinkClick = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <>
      {/* Desktop Header */}
      <header
        className={`
          fixed top-0 left-0 right-0 z-50
          h-[74px]
          bg-main border-b border-checkbox-border
          transition-transform duration-300 ease-in-out
          ${isVisible ? 'translate-y-0' : '-translate-y-full'}
          hidden md:block
        `}
      >
        <div className="max-w-[1440px] mx-auto h-full px-6 flex items-center justify-between">
              {/* Logo */}
              <div className="shrink-0">
                <a href="https://resilientleadership.us" className="flex items-center">
                  <Image
                    src="/resilient-leadership.png"
                    alt="Resilient Leadership"
                    width={200}
                    height={60}
                    className="h-12 w-auto invert"
                    priority
                  />
                </a>
              </div>

              {/* Navigation Links - Center */}
              <nav className="flex-1 flex items-center justify-center gap-8">
                <a
                  href="https://resilientleadership.us"
                  className="hover:text-button-primary transition-colors"
                >
                  <Typography variant="nav" as="span">What We Do</Typography>
                </a>
                {articlesLink.startsWith('http') ? (
                  <a
                    href={articlesLink}
                    className="hover:text-button-primary transition-colors"
                  >
                    <Typography variant="nav" as="span">Articles</Typography>
                  </a>
                ) : (
                  <Link
                    href={articlesLink}
                    className="hover:text-button-primary transition-colors"
                  >
                    <Typography variant="nav" as="span">Articles</Typography>
                  </Link>
                )}
                <a
                  href="https://resilientleadership.us/about"
                  className="hover:text-button-primary transition-colors"
                >
                  <Typography variant="nav" as="span">About</Typography>
                </a>
              </nav>

              {/* CTA Button - Right */}
              <div className="shrink-0">
                <Button
                  variant="primary"
                  size="sm"
                  href="https://resilientleadership.us/contact"
                >
                  Schedule a Consultation
                </Button>
              </div>
        </div>
      </header>

      {/* Mobile Header */}
      <header
        className="
          fixed top-0 left-0 right-0 z-50
          h-[74px]
          bg-main border-b border-checkbox-border
          md:hidden
        "
      >
        <div className="max-w-[1440px] mx-auto h-full px-4 flex items-center justify-between">
              {/* Left: MenuButton and Logo */}
              <div className="flex items-center gap-3">
                <MenuButton
                  isOpen={isMobileMenuOpen}
                  onToggle={handleMobileMenuToggle}
                />
                <a href="https://resilientleadership.us" className="flex items-center" onClick={handleNavLinkClick}>
                  <Image
                    src="/resilient-leadership.png"
                    alt="Resilient Leadership"
                    width={200}
                    height={60}
                    className="h-10 w-auto invert"
                    priority
                  />
                </a>
              </div>

              {/* Right: CTA Button */}
              <div className="shrink-0">
                <Button
                  variant="primary"
                  size="sm"
                  href="https://resilientleadership.us/contact"
                >
                  Schedule a Consultation
                </Button>
              </div>
        </div>
      </header>

      {/* Mobile Navigation Menu */}
      <div
        className={`
          fixed top-0 left-0 right-0 z-40
          h-dvh
          bg-main
          transition-transform duration-300 ease-in-out
          md:hidden
          ${isMobileMenuOpen ? 'translate-y-0' : '-translate-y-full'}
        `}
      >
        <nav className="h-full flex flex-col pt-[90px] px-6">
          <div className="flex flex-col gap-6">
            <a
              href="https://resilientleadership.us"
              onClick={handleNavLinkClick}
              className="hover:text-button-primary transition-colors py-2"
            >
              <Typography variant="body-large" as="span" className="font-medium">
                What We Do
              </Typography>
            </a>
            {articlesLink.startsWith('http') ? (
              <a
                href={articlesLink}
                onClick={handleNavLinkClick}
                className="hover:text-button-primary transition-colors py-2"
              >
                <Typography variant="body-large" as="span" className="font-medium">
                  Articles
                </Typography>
              </a>
            ) : (
              <Link
                href={articlesLink}
                onClick={handleNavLinkClick}
                className="hover:text-button-primary transition-colors py-2"
              >
                <Typography variant="body-large" as="span" className="font-medium">
                  Articles
                </Typography>
              </Link>
            )}
            <a
              href="https://resilientleadership.us/about"
              onClick={handleNavLinkClick}
              className="hover:text-button-primary transition-colors py-2"
            >
              <Typography variant="body-large" as="span" className="font-medium">
                About
              </Typography>
            </a>
          </div>
        </nav>
      </div>
    </>
  )
}

export default Header

