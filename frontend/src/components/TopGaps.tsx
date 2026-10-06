import type { TopGap } from '../types'

interface Props {
  items: TopGap[]
}

export default function TopGaps({ items }: Props) {
  if (items.length === 0) {
    return (
      <div className="border border-line rounded p-6 bg-bg">
        <p className="text-mute text-sm">No class-wide gaps</p>
      </div>
    )
  }

  const displayItems = items.slice(0, 5)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {displayItems.map((gap) => {
        const avgMastery = Math.round(gap.avg_mastery * 100)
        return (
          <div key={gap.concept} className="border border-line rounded p-4 bg-bg space-y-2">
            <h4 className="text-lg font-display text-ink">{gap.concept}</h4>
            <div className="space-y-1 text-sm">
              <p className="text-mute">
                {gap.affected_students} {gap.affected_students === 1 ? 'student' : 'students'} affected
              </p>
              <p className="font-mono tracking-wider text-ink">Avg mastery {avgMastery}%</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
