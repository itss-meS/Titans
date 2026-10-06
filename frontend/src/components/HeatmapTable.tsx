import type { DashboardStudent, CellSeverity } from '../types'

interface Props {
  concepts: string[]
  students: DashboardStudent[]
  onSelect: (id: string) => void
  filterConcept: string | null
  onFilterConcept: (concept: string | null) => void
}

export default function HeatmapTable({ concepts, students, onSelect, filterConcept, onFilterConcept }: Props) {
  const getCellStyle = (severity: CellSeverity): string => {
    const styles: Record<CellSeverity, string> = {
      critical: 'bg-accent text-onAccent',
      high: 'bg-accentSoft',
      medium: 'border border-accent bg-transparent',
      low: 'bg-muteSoft',
      none: 'bg-surface border border-line',
    }
    return styles[severity]
  }

  const getSeverityLabel = (severity: CellSeverity): string => {
    return severity.charAt(0).toUpperCase() + severity.slice(1)
  }

  const toggleConceptFilter = (concept: string) => {
    if (filterConcept === concept) {
      onFilterConcept(null)
    } else {
      onFilterConcept(concept)
    }
  }

  if (students.length === 0) {
    return (
      <div className="border border-line rounded p-6 bg-bg text-center text-mute">
        No students match
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="border border-line rounded overflow-hidden">
        <div className="overflow-auto max-h-[560px]">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10 bg-bg">
              <tr className="border-b border-line">
                <th className="text-left p-3 text-xs font-mono tracking-wider text-mute sticky left-0 bg-bg z-20">
                  Student
                </th>
                {concepts.map((concept) => {
                  const isActive = filterConcept === concept
                  return (
                    <th key={concept} className="min-w-[120px]">
                      <button
                        onClick={() => toggleConceptFilter(concept)}
                        aria-pressed={isActive}
                        className={`w-full text-left p-3 text-xs font-mono tracking-wider transition-colors duration-150 ${
                          isActive ? 'text-accent' : 'text-mute hover:text-ink'
                        }`}
                      >
                        {concept}
                      </button>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {students.map((student) => {
                const mastery = Math.round(student.overall_mastery * 100)
                return (
                  <tr
                    key={student.student_id}
                    onClick={() => onSelect(student.student_id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onSelect(student.student_id)
                      }
                    }}
                    tabIndex={0}
                    className="border-b border-line cursor-pointer hover:bg-surface transition-colors duration-150"
                  >
                    <td className="p-3 sticky left-0 bg-bg z-10">
                      <div className="space-y-1">
                        <div className="font-medium text-ink">{student.name}</div>
                        <div className="text-xs font-mono tracking-wider text-mute">{mastery}%</div>
                      </div>
                    </td>
                    {concepts.map((concept) => {
                      const cell = student.cells.find((item) => item.concept === concept) || {
                        concept,
                        severity: 'none' as CellSeverity,
                        mastery: null,
                      }
                      const cellMastery = cell.mastery !== null ? Math.round(cell.mastery * 100) : null
                      const severityLabel = getSeverityLabel(cell.severity)
                      return (
                        <td key={concept} className="p-3">
                          <div
                            className={`px-3 py-2 rounded text-center text-sm font-mono ${getCellStyle(cell.severity)}`}
                            aria-label={`${cell.concept}: ${severityLabel}, ${cellMastery !== null ? cellMastery + ' percent' : 'no data'}`}
                          >
                            {cellMastery !== null ? `${cellMastery}%` : '—'}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs font-mono tracking-wider">
        <span className="text-mute">Legend:</span>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-accent"></div>
          <span className="text-ink">Critical</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-accentSoft"></div>
          <span className="text-ink">High</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border border-accent"></div>
          <span className="text-ink">Medium</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-muteSoft"></div>
          <span className="text-ink">Low</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-surface border border-line"></div>
          <span className="text-ink">None</span>
        </div>
      </div>
    </div>
  )
}
