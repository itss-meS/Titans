interface Props {
  value: number
}

export default function ConfidenceMeter({ value }: Props) {
  const percent = Math.round(value * 100)

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono tracking-wider text-mute">Confidence</span>
        <span className="text-xs font-mono tracking-wider text-ink">{percent}%</span>
      </div>
      <div
        className="h-1 bg-line rounded-full overflow-hidden"
        role="progressbar"
        aria-label={`Confidence ${percent} percent`}
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full bg-accent transition-all duration-500 ease-out"
          style={{ width: `${percent}%` }}
        ></div>
      </div>
    </div>
  )
}
