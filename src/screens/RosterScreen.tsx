import { useState } from 'react'
import { AddPlayerSheet } from '../components/AddPlayerSheet'
import { useStore } from '../store'
import type { View } from '../types'

type Props = {
  onNavigate: (view: View) => void
}

export function RosterScreen({ onNavigate }: Props) {
  const { players, pitches, addPlayer, removePlayer, setCurrentPlayerId } = useStore()
  const [adding, setAdding] = useState(false)

  function openHeatmap(id: string) {
    setCurrentPlayerId(id)
    onNavigate('player-heatmap')
  }

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

      <p className="empty-copy">Tap a player to see their heatmap and season stats.</p>

      <ul className="roster-list">
        {players.map((player) => {
          const count = pitches.filter((p) => p.playerId === player.id).length
          return (
            <li key={player.id} className="roster-row">
              <button type="button" className="roster-open" onClick={() => openHeatmap(player.id)}>
                <strong>{player.name}</strong>
                <span>
                  {count} {count === 1 ? 'pitch' : 'pitches'}
                </span>
              </button>
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
