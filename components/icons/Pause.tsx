import React from 'react'

interface PauseProps {
  className?: string
}

export const Pause: React.FC<PauseProps> = ({ className }) => {
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
        d="M5 3H7V13H5V3ZM9 3H11V13H9V3Z"
        fill="currentColor"
      />
    </svg>
  )
}

export default Pause

