import { useState, type FormEvent } from 'react'

type Props = {
  title?: string
  onAdd: (name: string) => void
  onClose: () => void
}

export function AddPlayerSheet({ title = 'Add player', onAdd, onClose }: Props) {
  const [name, setName] = useState('')

  function submit(e: FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setName('')
  }

  return (
    <div className="sheet-backdrop" onClick={onClose} role="presentation">
      <div
        className="sheet"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={title}
      >
        <div className="sheet-handle" />
        <h2>{title}</h2>
        <form onSubmit={submit}>
          <label className="field-label" htmlFor="player-name">
            Player name
          </label>
          <input
            id="player-name"
            autoFocus
            autoComplete="off"
            enterKeyHint="done"
            placeholder="e.g. Maya"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" disabled={!name.trim()}>
            Add player
          </button>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
        </form>
      </div>
    </div>
  )
}
