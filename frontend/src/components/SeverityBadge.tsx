import type { CellSeverity } from '../types'

interface Props {
  severity: CellSeverity
}

export default function SeverityBadge({ severity }: Props) {
  const styles: Record<CellSeverity, string> = {
    critical: 'bg-accent text-onAccent',
    high: 'bg-accentSoft text-ink',
    medium: 'border border-accent bg-transparent text-ink',
    low: 'bg-muteSoft text-ink',
    none: 'border border-line bg-transparent text-mute',
  }

  const label = severity.charAt(0).toUpperCase() + severity.slice(1)

  return (
    <span className={`inline-block px-3 py-1 rounded-full text-xs font-mono tracking-wider ${styles[severity]}`}>
      {label}
    </span>
  )
}
