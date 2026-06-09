import React from 'react'
void React

export function HoneycombStamp({ className = '' }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden>
      <g stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 7 32 14v14L20 35 8 28V14L20 7Z" />
        <path d="M44 7 56 14v14L44 35 32 28V14L44 7Z" />
        <path d="M32 28 44 35v14L32 56 20 49V35l12-7Z" />
      </g>
    </svg>
  )
}

export function WildflowerStamp({ className = '' }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden>
      <g stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="32" cy="30" r="6" />
        <path d="M32 10v8M32 42v8M12 30h8M44 30h8M18 16l6 6M40 38l6 6M46 16l-6 6M24 38l-6 6" />
        <path d="M30 50c-2.5 1.5-4 3.8-4 7M34 50c2.5 1.5 4 3.8 4 7" />
      </g>
    </svg>
  )
}

export function FieldLinesStamp({ className = '' }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden>
      <g stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
        <path d="M8 49c12-7 36-7 48 0" />
        <path d="M10 40c11-6 33-6 44 0" />
        <path d="M14 31c9-5 27-5 36 0" />
        <path d="M22 19c5-3 15-3 20 0" />
        <path d="M32 8v42" />
      </g>
    </svg>
  )
}

export function BeeTrailIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <path d="M3 9c3-2 4 3 7 1s3-5 7-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeDasharray="3 3" />
      <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 9.5a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
        <path d="M11.5 12.5h6M14.5 9.5V8M14.5 17v-1.5" />
        <path d="M16.6 8.5l2.1-1.7M12.4 8.5 10.3 6.8" />
      </g>
    </svg>
  )
}
