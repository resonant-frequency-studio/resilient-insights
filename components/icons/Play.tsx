import React from 'react'

interface PlayProps {
  className?: string
}

export const Play: React.FC<PlayProps> = ({ className }) => {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M4 3L12 8L4 13V3Z"
        fill="currentColor"
      />
    </svg>
  )
}

export default Play

