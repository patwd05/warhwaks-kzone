type Props = {
  view: 'track' | 'heatmap'
  onTrack: () => void
  onHeatmap: () => void
}

export function BottomNav({ view, onTrack, onHeatmap }: Props) {
  return (
    <nav className="bottom-nav" aria-label="Views">
      <button
        type="button"
        className={view === 'track' ? 'is-active' : ''}
        onClick={onTrack}
      >
        <span className="nav-icon" aria-hidden>
          ●
        </span>
        Track
      </button>
      <button
        type="button"
        className={view === 'heatmap' ? 'is-active' : ''}
        onClick={onHeatmap}
      >
        <span className="nav-icon" aria-hidden>
          ▦
        </span>
        Heatmap
      </button>
    </nav>
  )
}
