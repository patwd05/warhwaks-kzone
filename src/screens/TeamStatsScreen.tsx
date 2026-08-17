import { TeamStats } from '../components/TeamStats'
import { useStore } from '../store'
import type { View } from '../types'

type Props = {
  onNavigate: (view: View) => void
}

export function TeamStatsScreen({ onNavigate }: Props) {
  const { setCurrentPlayerId } = useStore()

  return (
    <div className="screen">
      <header className="screen-header">
        <button type="button" className="back-btn" onClick={() => onNavigate('home')}>
          Back
        </button>
        <h1>Team stats</h1>
      </header>

      <TeamStats
        onOpenPlayer={(id) => {
          setCurrentPlayerId(id)
          onNavigate('player-heatmap')
        }}
      />
    </div>
  )
}
