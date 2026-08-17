import { AT_BAT_OUTCOMES, type AtBatOutcome } from '../types'

type Props = {
  disabled?: boolean
  onSelect: (outcome: AtBatOutcome) => void
}

export function AtBatBar({ disabled, onSelect }: Props) {
  return (
    <div className="at-bat-bar" role="group" aria-label="At-bat result">
      {AT_BAT_OUTCOMES.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`at-bat-btn at-bat-btn--${item.id}`}
          disabled={disabled}
          onClick={() => onSelect(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}
