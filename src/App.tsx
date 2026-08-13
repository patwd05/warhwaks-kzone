import { useState } from 'react'
import { EventSetupScreen } from './screens/EventSetupScreen'
import { HeatmapScreen } from './screens/HeatmapScreen'
import { HomeScreen } from './screens/HomeScreen'
import { RosterScreen } from './screens/RosterScreen'
import { TrackScreen } from './screens/TrackScreen'
import { StoreProvider } from './store'
import type { View } from './types'

export default function App() {
  const [view, setView] = useState<View>('home')

  return (
    <StoreProvider>
      <div className="app-shell">
        {view === 'home' && <HomeScreen onNavigate={setView} />}
        {view === 'setup' && <EventSetupScreen onNavigate={setView} />}
        {view === 'roster' && <RosterScreen onNavigate={setView} />}
        {view === 'track' && <TrackScreen onNavigate={setView} />}
        {view === 'heatmap' && <HeatmapScreen onNavigate={setView} />}
      </div>
    </StoreProvider>
  )
}
