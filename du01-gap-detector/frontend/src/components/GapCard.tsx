import { Check } from 'lucide-react'
import type { GapOut } from '../types'
import SeverityBadge from './SeverityBadge'
import ConfidenceMeter from './ConfidenceMeter'

interface Props {
  gap: GapOut
}

export default function GapCard({ gap }: Props) {
  const masteryPercent = Math.round(gap.mastery * 100)

  const getEvidenceStyle = (text: string) => {
    const lower = text.toLowerCase()
    if (lower.includes('correct') && !lower.includes('incorrect')) {
      return 'bg-muteSoft text-ink border-0'
    }
    if (lower.includes('partial')) {
      return 'border border-accent bg-transparent text-ink'
    }
    if (lower.includes('incorrect')) {
      return 'bg-accent text-onAccent border-0'
    }
    return 'bg-muteSoft text-ink border-0'
  }

  return (
    <div className="border border-line rounded p-6 space-y-4 bg-bg">
      <div className="space-y-2">
        <h3 className="text-2xl font-display text-ink">{gap.concept}</h3>
        <div className="flex items-center gap-3">
          <SeverityBadge severity={gap.severity} />
          <span className="text-sm font-mono tracking-wider text-mute">
            Mastery {masteryPercent}%
          </span>
        </div>
      </div>

      <ConfidenceMeter value={gap.confidence} />

      {gap.trend && (
        <p className="text-sm text-mute">{gap.trend}</p>
      )}

      {gap.prerequisite_gaps.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-mono tracking-wider text-mute">Prerequisite gaps</p>
          <p className="text-sm text-ink">{gap.prerequisite_gaps.join(', ')}</p>
        </div>
      )}

      {gap.evidence.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-mono tracking-wider text-mute">Evidence</p>
          <div className="flex flex-wrap gap-2">
            {gap.evidence.map((item, i) => (
              <span
                key={i}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${getEvidenceStyle(item)}`}
              >
                {item.toLowerCase().includes('correct') && !item.toLowerCase().includes('incorrect') && (
                  <Check size={12} strokeWidth={2} />
                )}
                {item}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
