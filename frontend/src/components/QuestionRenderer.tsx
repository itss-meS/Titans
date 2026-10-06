import type { PracticeQOut } from '../types'

interface Props {
  question: PracticeQOut
  value: string
  onChange: (v: string) => void
  disabled: boolean
}

export default function QuestionRenderer({ question, value, onChange, disabled }: Props) {
  return (
    <div className="space-y-4">
      <p className="text-ink whitespace-pre-wrap">{question.stem}</p>

      {question.type === 'mcq' && (
        <div className="space-y-2" role="radiogroup">
          {question.options.map((option, i) => (
            <label
              key={i}
              className={`flex items-start gap-3 p-3 border border-line rounded cursor-pointer hover:border-accent transition-colors duration-150 ${
                value === option ? 'border-accent bg-accentFaint' : 'bg-bg'
              } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <input
                type="radio"
                name="answer"
                value={option}
                checked={value === option}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                className="mt-1"
              />
              <span className="text-ink flex-1">{option}</span>
            </label>
          ))}
        </div>
      )}

      {question.type === 'code' && (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          rows={8}
          className="w-full p-3 border border-line rounded font-mono text-sm bg-bg text-ink disabled:opacity-60 disabled:cursor-not-allowed focus:border-accent transition-colors duration-150"
          placeholder="Write your code here..."
        />
      )}

      {question.type === 'short_answer' && (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-full p-3 border border-line rounded bg-bg text-ink disabled:opacity-60 disabled:cursor-not-allowed focus:border-accent transition-colors duration-150"
          placeholder="Your answer..."
        />
      )}
    </div>
  )
}
