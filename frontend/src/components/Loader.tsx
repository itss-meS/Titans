interface Props {
  label?: string
}

export default function Loader({ label = 'Loading' }: Props) {
  return (
    <div role="status" className="space-y-4 animate-pulse">
      <span className="sr-only">{label}</span>
      <div className="h-8 bg-surface rounded w-1/3"></div>
      <div className="h-4 bg-surface rounded w-2/3"></div>
      <div className="h-4 bg-surface rounded w-1/2"></div>
      <div className="h-32 bg-surface rounded"></div>
      <div className="h-4 bg-surface rounded w-3/4"></div>
    </div>
  )
}
