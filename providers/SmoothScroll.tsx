'use client'

import { useEffect } from 'react'
import Lenis from 'lenis'

export default function SmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      smoothWheel: true,

      // "soft stop" knobs:
      duration: 1.1, // try 0.9–1.4
      easing: (t: number) => 1 - Math.pow(1 - t, 3), // nice, gentle easeOutCubic

      // optional: reduces jitter when wheel input is spiky
      // wheelMultiplier: 1,
    })

    let rafId = 0
    const raf = (time: number) => {
      lenis.raf(time)
      rafId = requestAnimationFrame(raf)
    }
    rafId = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(rafId)
      lenis.destroy()
    }
  }, [])

  return null
}

