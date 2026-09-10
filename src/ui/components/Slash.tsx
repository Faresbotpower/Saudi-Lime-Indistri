type Props = { size?: number; color?: string; className?: string }

/** The Sia diagonal slash. Used as a list marker and active-state indicator, sparingly. */
export function Slash({ size = 14, color = 'var(--teal)', className }: Props) {
  const w = Math.round(size * 0.55)
  return (
    <svg
      width={w}
      height={size}
      viewBox="0 0 11 20"
      fill="none"
      aria-hidden="true"
      className={className}
      style={{ display: 'inline-block', flex: 'none' }}
    >
      <path d="M10 1 1 19" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
