export const designTokens = {
  color: {
    primary: '#185FA5',
    primaryHover: '#12497f',
    primarySoft: '#dbeafe',
    text: '#1f2937',
    textMuted: '#475569',
    textOnDark: '#f8fafc',
    textMutedOnDark: '#cbd5e1',
    surface: '#ffffff',
    surfaceMuted: '#f8fafc',
    surfaceDark: '#111827',
    surfaceDarkElevated: '#1f2937',
    border: '#cbd5e1',
    borderDark: '#64748b',
    success: '#15803d',
    danger: '#dc2626',
    warning: '#b45309',
    focus: '#3b82f6',
    honey: '#b7791f',
    honeyBright: '#f59e0b',
  },
  typography: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    bodySize: '0.9375rem',
    labelSize: '0.8125rem',
  },
  breakpoint: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
  },
} as const

export type DesignTokens = typeof designTokens
