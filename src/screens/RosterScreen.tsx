import { useState } from 'react'
import { AddPlayerSheet } from '../components/AddPlayerSheet'
import { useStore } from '../store'
import type { View } from '../types'

type Props = {
  onNavigate: (view: View) => void
}

export function RosterScreen({ onNavigate }: Props) {
  const { players, pitches, addPlayer, removePlayer } = useStore()
  const [adding, setAdding] = useState(false)

  return (
    <div className="screen">
      <header className="screen-header">
        <button type="button" className="back-btn" onClick={() => onNavigate('home')}>
          Back
        </button>
        <h1>Players</h1>
      </header>

      <button type="button" className="btn btn-primary" onClick={() => setAdding(true)}>
        Add player
      </button>

      {players.length === 0 && (
        <p className="empty-copy">Add the kids you want to track. You can also add them from the pitch screen.</p>
      )}

      <ul className="roster-list">
        {players.map((player) => {
          const count = pitches.filter((p) => p.playerId === player.id).length
          return (
            <li key={player.id} className="roster-row">
              <div>
                <strong>{player.name}</strong>
                <span>
                  {count} {count === 1 ? 'pitch' : 'pitches'}
                </span>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => removePlayer(player.id)}
              >
                Remove
              </button>
            </li>
          )
        })}
      </ul>

      {adding && (
        <AddPlayerSheet
          onClose={() => setAdding(false)}
          onAdd={(name) => {
            addPlayer(name)
            setAdding(false)
          }}
        />
      )}
    </div>
  )
}
