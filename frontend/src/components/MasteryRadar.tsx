import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts'
import type { ConceptMastery } from '../types'

interface Props {
  data: ConceptMastery[]
}

export default function MasteryRadar({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center border border-line rounded bg-bg">
        <p className="text-mute text-sm">No mastery data available</p>
      </div>
    )
  }

  const chartData = data.map((item) => ({
    concept: item.concept,
    mastery: Math.round(item.mastery * 100),
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={chartData}>
        <PolarGrid stroke="var(--line)" />
        <PolarAngleAxis
          dataKey="concept"
          tick={{ fill: 'var(--mute)', fontSize: 11, fontFamily: 'Geist Mono' }}
        />
        <PolarRadiusAxis
          domain={[0, 100]}
          tick={{ fill: 'var(--mute)', fontSize: 11, fontFamily: 'Geist Mono' }}
        />
        <Radar
          dataKey="mastery"
          stroke="var(--accent)"
          fill="var(--accent)"
          fillOpacity={0.2}
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}
