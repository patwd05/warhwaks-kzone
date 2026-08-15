import type { Player } from '../types'

type Props = {
  players: Player[]
  value: string | null
  onChange: (id: string | null) => void
  onAddPlayer: () => void
  allowAll?: boolean
}

export function PlayerSelect({
  players,
  value,
  onChange,
  onAddPlayer,
  allowAll = false,
}: Props) {
  return (
    <div className="player-select">
      <label htmlFor="player-select">{allowAll ? 'Player' : 'Pitcher'}</label>
      <div className="player-select-row">
        <select
          id="player-select"
          value={value ?? ''}
          onChange={(e) => {
            const v = e.target.value
            if (v === '__add__') {
              onAddPlayer()
              return
            }
            onChange(v || null)
          }}
        >
          <option value="" disabled={!allowAll}>
            {allowAll ? 'All players' : players.length ? 'Select a Pitcher' : 'No players yet'}
          </option>
          {players.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
          <option value="__add__">+ Add player</option>
        </select>
      </div>
    </div>
  )
}
