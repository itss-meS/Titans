interface Props {
  message: string
  onRetry: () => void
}

export default function ErrorBox({ message, onRetry }: Props) {
  return (
    <div className="border border-accent bg-bg rounded p-6 space-y-4">
      <p className="text-ink">{message}</p>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-accent text-onAccent rounded-full font-medium hover:opacity-90 transition-opacity duration-200"
      >
        Retry
      </button>
    </div>
  )
}
