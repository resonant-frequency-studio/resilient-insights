'use client'

import { useState, useRef, useEffect, type MouseEvent } from 'react'
import Button from './Button'
import { Play } from './icons/Play'
import { Pause } from './icons/Pause'
import Typography from './Typography'

interface AudioPlayerProps {
  slug: string
  className?: string
}

type AudioState = 'idle' | 'loading' | 'playing' | 'paused' | 'error'

export default function AudioPlayer({ slug, className }: AudioPlayerProps) {
  const [state, setState] = useState<AudioState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0) // 0-100
  const [loadingProgress, setLoadingProgress] = useState(0) // 0-100 for loading indicator
  const [currentTime, setCurrentTime] = useState(0) // in seconds
  const [duration, setDuration] = useState(0) // in seconds
  const [hasStarted, setHasStarted] = useState(false) // Track if user has clicked play at least once
  const [showLoadingMessage, setShowLoadingMessage] = useState(false) // Show message after delay
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const isLoadingRef = useRef(false) // Track loading state without React re-renders
  const wantsToPlayRef = useRef(false) // Track if user wants to play after loading
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    if (!isFinite(seconds) || isNaN(seconds)) return '00:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  useEffect(() => {
    // Create audio element on mount
    const audio = new Audio()
    audioRef.current = audio

    // Set up event listeners
    const handleLoadStart = () => {
      isLoadingRef.current = true
      setState('loading')
      setLoadingProgress(5) // Start with small progress
      // Show loading message after 2 seconds if still loading
      loadingTimeoutRef.current = setTimeout(() => {
        if (isLoadingRef.current) {
          setShowLoadingMessage(true)
        }
      }, 2000)
    }

    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
      // Update loading progress now that we have duration
      if (audio.buffered.length > 0 && audio.duration > 0) {
        const bufferedEnd = audio.buffered.end(audio.buffered.length - 1)
        const bufferedPercent = (bufferedEnd / audio.duration) * 100
        setLoadingProgress(Math.min(bufferedPercent, 100))
      }
    }

    const handleCanPlay = async () => {
      // Clear loading message timeout since audio is ready
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
        loadingTimeoutRef.current = null
      }
      setShowLoadingMessage(false)
      
      // If user wants to play, do it now that audio is ready
      if (wantsToPlayRef.current && isLoadingRef.current) {
        isLoadingRef.current = false
        wantsToPlayRef.current = false
        try {
          await audio.play()
          // play() will trigger the 'play' event which sets state to 'playing'
        } catch (err: any) {
          // Ignore AbortError - it happens when play() is interrupted
          if (err.name !== 'AbortError') {
            console.error('Error playing audio:', err)
            setState('error')
            setError('Failed to play audio. Please try again.')
          }
        }
      } else if (isLoadingRef.current && audio.paused) {
        // User didn't want to play, just mark as ready
        isLoadingRef.current = false
        setState('paused')
      }
    }

    const handleCanPlayThrough = async () => {
      // Clear loading message timeout since audio is ready
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
        loadingTimeoutRef.current = null
      }
      setShowLoadingMessage(false)
      
      // Audio can play through without stopping
      if (isLoadingRef.current) {
        setLoadingProgress(100)
        
        // If user wants to play, do it now
        if (wantsToPlayRef.current) {
          isLoadingRef.current = false
          wantsToPlayRef.current = false
          try {
            await audio.play()
          } catch (err: any) {
            if (err.name !== 'AbortError') {
              console.error('Error playing audio:', err)
              setState('error')
              setError('Failed to play audio. Please try again.')
            }
          }
        } else if (audio.paused) {
          isLoadingRef.current = false
          setState('paused')
        }
      }
    }

    const handleTimeUpdate = () => {
      if (audio.duration) {
        const newProgress = (audio.currentTime / audio.duration) * 100
        setProgress(newProgress)
        setCurrentTime(audio.currentTime)
      }
    }

    const handlePlay = () => {
      isLoadingRef.current = false
      wantsToPlayRef.current = false
      setState('playing')
      setShowLoadingMessage(false)
      // Clear timeout if audio started playing
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
        loadingTimeoutRef.current = null
      }
    }

    const handlePause = () => {
      // Don't set to paused if we're trying to play (loading with wantsToPlay)
      // This prevents race conditions where pause fires during loading
      if (!isLoadingRef.current || !wantsToPlayRef.current) {
        if (audio.readyState >= 2) {
          setState('paused')
        }
      }
    }

    const handleEnded = () => {
      isLoadingRef.current = false
      setState('idle')
      setProgress(0)
      setCurrentTime(0)
    }

    const handleError = () => {
      isLoadingRef.current = false
      setState('error')
      setError('Failed to load audio. Please try again.')
      setShowLoadingMessage(false)
      // Clear timeout on error
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
        loadingTimeoutRef.current = null
      }
    }

    const handleProgress = () => {
      // Update loading progress based on buffered data
      if (audio.buffered.length > 0) {
        if (audio.duration && audio.duration > 0) {
          // We have duration, calculate percentage
          const bufferedEnd = audio.buffered.end(audio.buffered.length - 1)
          const bufferedPercent = (bufferedEnd / audio.duration) * 100
          setLoadingProgress((prev) => {
            // Always increase, never decrease
            return Math.max(prev, Math.min(bufferedPercent, 100))
          })
        } else {
          // No duration yet, but we have buffered data - gradually increase progress
          setLoadingProgress((prev) => {
            // Gradually increase to show progress
            if (prev < 20) return 20
            if (prev < 40) return prev + 2
            if (prev < 60) return prev + 1.5
            if (prev < 80) return prev + 1
            return Math.min(prev + 0.5, 95) // Cap at 95% until we have duration
          })
        }
      } else if (isLoadingRef.current) {
        // No buffered data yet, but we're loading - show minimal progress
        setLoadingProgress((prev) => {
          if (prev < 10) return 10
          return prev
        })
      }
    }

    audio.addEventListener('loadstart', handleLoadStart)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('canplay', handleCanPlay)
    audio.addEventListener('canplaythrough', handleCanPlayThrough)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('progress', handleProgress)
    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError)

    // Cleanup
    return () => {
      audio.removeEventListener('loadstart', handleLoadStart)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('canplay', handleCanPlay)
      audio.removeEventListener('canplaythrough', handleCanPlayThrough)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('progress', handleProgress)
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError)
      audio.pause()
      audio.src = ''
      // Clear any pending timeouts
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
        loadingTimeoutRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run once on mount

  const handleTogglePlay = async () => {
    const audio = audioRef.current
    if (!audio) return

    try {
      if (state === 'idle' || state === 'paused') {
        setHasStarted(true)
        setError(null)
        
        // Set audio source
        const audioUrl = `/api/tts/article?slug=${encodeURIComponent(slug)}`
        const currentSrc = audio.src || ''
        const needsNewSource = !currentSrc || !currentSrc.includes(`slug=${encodeURIComponent(slug)}`)
        
        if (needsNewSource) {
          // New source - set loading state first
          wantsToPlayRef.current = true
          isLoadingRef.current = true
          setState('loading')
          setLoadingProgress(0)
          setShowLoadingMessage(false) // Reset message, will show after delay if needed
          
          // Set source and load - this will trigger loadstart event
          audio.src = audioUrl
          audio.load()
        } else {
          // Source already set
          if (audio.readyState >= 2) {
            // Audio is ready
            if (audio.paused) {
              // Play it
              await audio.play()
            }
          } else {
            // Audio is still loading, wait for it
            wantsToPlayRef.current = true
            isLoadingRef.current = true
            setState('loading')
            setShowLoadingMessage(false) // Reset message, will show after delay if needed
          }
        }
      } else if (state === 'playing') {
        audio.pause()
      }
    } catch (err: any) {
      // Ignore AbortError - it's expected when play() is interrupted
      if (err.name === 'AbortError') {
        return
      }
      console.error('Error playing audio:', err)
      wantsToPlayRef.current = false
      isLoadingRef.current = false
      setState('error')
      setError('Failed to play audio. Please try again.')
    }
  }

  const handleSeek = (e: MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    if (!audio || !duration) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percent = x / rect.width
    const newTime = percent * duration

    audio.currentTime = newTime
    setProgress(percent * 100)
    setCurrentTime(newTime)
  }

  // Show full player UI after first click
  if (hasStarted) {
    const isLoading = state === 'loading'
    const isPlaying = state === 'playing'

    return (
      <div className={`${className} min-h-[64px]`}>
        <div className="flex items-center gap-4 w-full">
          {/* Play/Pause Button */}
          <button
            onClick={handleTogglePlay}
            disabled={isLoading}
            className={`
              shrink-0 w-12 h-12 rounded-full
              flex items-center justify-center
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-button-primary
              disabled:opacity-50 disabled:cursor-not-allowed
              relative overflow-hidden
              ${isLoading 
                ? 'bg-button-outline-border text-foreground-dark border border-button-outline-border' 
                : 'bg-button-primary text-foreground-light border border-button-primary hover:bg-button-primary-hover'
              }
            `}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            aria-pressed={isPlaying}
          >
            {/* Loading indicator - fills button background with button-primary color */}
            {isLoading && (
              <div 
                className="absolute inset-0 bg-button-primary transition-all duration-500 ease-out"
                style={{
                  width: `${Math.min(Math.max(loadingProgress, 0), 100)}%`,
                  left: 0,
                }}
              />
            )}
            <span className={`relative z-10 transition-colors ${isLoading ? 'text-foreground-light' : ''}`}>
              {isLoading ? (
                <Play className="w-5 h-5" />
              ) : isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5" />
              )}
            </span>
          </button>

          {/* Progress Bar and Time */}
          <div className="flex-1 min-w-0">
            {/* Progress Bar */}
            <div
              className="relative h-2 bg-checkbox-border rounded-full cursor-pointer group"
              onClick={handleSeek}
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={duration || 0}
              aria-valuenow={currentTime}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                  e.preventDefault()
                  const audio = audioRef.current
                  if (!audio) return
                  const step = e.key === 'ArrowLeft' ? -5 : 5
                  audio.currentTime = Math.max(0, Math.min(duration, audio.currentTime + step))
                }
              }}
            >
            {/* Loading indicator background */}
            {isLoading && (
              <div 
                className="absolute inset-0 bg-button-primary/20 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${Math.min(Math.max(loadingProgress, 0), 100)}%` }}
              />
            )}
              
              {/* Played progress */}
              {!isLoading && (
                <div
                  className="absolute inset-y-0 left-0 bg-button-primary rounded-full transition-all duration-100"
                  style={{ width: `${progress}%` }}
                />
              )}

              {/* Hover indicator */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <div
                  className="absolute inset-y-0 left-0 bg-button-primary/30 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Time Display */}
            <div className="flex justify-between items-center mt-1">
              <Typography variant="body-small" as="span" className="text-foreground-dark tabular-nums">
                {formatTime(currentTime)}
              </Typography>
              <Typography variant="body-small" as="span" className="text-foreground-dark tabular-nums">
                {formatTime(duration)}
              </Typography>
            </div>
          </div>
        </div>

        {/* Loading message - shows after 2 seconds if still loading */}
        {isLoading && showLoadingMessage && (
          <div role="status" aria-live="polite" className="mt-3">
            <Typography variant="body-small" as="span" className="text-foreground-dark italic">
              Generating audio... This may take a minute on first play.
            </Typography>
          </div>
        )}

        {error && (
          <div role="status" aria-live="polite" className="mt-2">
            <Typography variant="body-small" as="span" className="text-red-600">
              {error}
            </Typography>
          </div>
        )}
      </div>
    )
  }

  // Initial button state - before first click
  return (
    <div className={`${className} min-h-[64px]`}>
      <Button
        variant="outline"
        size="sm"
        icon={<Play />}
        iconPosition="left"
        onClick={handleTogglePlay}
        aria-label="Listen to this article"
      >
        LISTEN TO THIS ARTICLE
      </Button>
      {error && (
        <div role="status" aria-live="polite" className="mt-2">
          <Typography variant="body-small" as="span" className="text-red-600">
            {error}
          </Typography>
        </div>
      )}
    </div>
  )
}
