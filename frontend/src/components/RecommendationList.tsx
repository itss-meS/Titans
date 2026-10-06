import { BookOpen, Dumbbell, Link2, Users, Video } from 'lucide-react'
import type { RecommendationOut } from '../types'

interface Props {
  items: RecommendationOut[]
}

export default function RecommendationList({ items }: Props) {
  if (items.length === 0) {
    return (
      <div className="border border-line rounded p-6 bg-bg">
        <p className="text-mute text-sm">No recommendations available</p>
      </div>
    )
  }

  const getIcon = (type: string) => {
    const iconProps = { size: 20, strokeWidth: 1.5 }
    switch (type) {
      case 'study':
        return <BookOpen {...iconProps} />
      case 'practice':
        return <Dumbbell {...iconProps} />
      case 'scaffolded':
        return <Link2 {...iconProps} />
      case 'peer_tutoring':
        return <Users {...iconProps} />
      case 'video':
        return <Video {...iconProps} />
      default:
        return <BookOpen {...iconProps} />
    }
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.priority} className="border border-line rounded p-4 bg-bg hover:border-accent transition-colors duration-200">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muteSoft flex items-center justify-center text-xs font-mono text-ink">
              {item.priority}
            </div>
            <div className="flex-shrink-0 text-accent mt-1">
              {getIcon(item.type)}
            </div>
            <div className="flex-1 space-y-1">
              <h4 className="text-ink font-medium">{item.title}</h4>
              <p className="text-sm text-mute">{item.description}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs font-mono tracking-wider text-mute">
                  {item.estimated_time_min} min
                </span>
                <span className="text-xs text-mute">→ {item.target_concept}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
