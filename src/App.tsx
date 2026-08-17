import { useState } from 'react'
import { EventSetupScreen } from './screens/EventSetupScreen'
import { HeatmapScreen } from './screens/HeatmapScreen'
import { HomeScreen } from './screens/HomeScreen'
import { RosterScreen } from './screens/RosterScreen'
import { TeamStatsScreen } from './screens/TeamStatsScreen'
import { TrackScreen } from './screens/TrackScreen'
import { StoreProvider } from './store'
import type { View } from './types'

export default function App() {
  const [view, setView] = useState<View>('home')
  const [playerBack, setPlayerBack] = useState<View>('roster')

  function go(next: View, from?: View) {
    if (next === 'player-heatmap') setPlayerBack(from ?? 'roster')
    setView(next)
  }

  return (
    <StoreProvider>
      <div className="app-shell">
        {view === 'home' && <HomeScreen onNavigate={setView} />}
        {view === 'setup' && <EventSetupScreen onNavigate={setView} />}
        {view === 'roster' && (
          <RosterScreen onNavigate={(next) => go(next, 'roster')} />
        )}
        {view === 'team-stats' && (
          <TeamStatsScreen onNavigate={(next) => go(next, 'team-stats')} />
        )}
        {view === 'track' && <TrackScreen onNavigate={setView} />}
        {view === 'heatmap' && <HeatmapScreen onNavigate={setView} mode="session" />}
        {view === 'player-heatmap' && (
          <HeatmapScreen onNavigate={setView} mode="player" backView={playerBack} />
        )}
      </div>
    </StoreProvider>
  )
}
