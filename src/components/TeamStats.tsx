import { useMemo, useState } from 'react'
import { formatStat, rankPlayers, STAT_CATEGORIES, type StatKey } from '../stats'
import { useStore } from '../store'

type Props = {
  onOpenPlayer: (id: string) => void
}

export function TeamStats({ onOpenPlayer }: Props) {
  const { players, pitches, atBats, events } = useStore()
  const [category, setCategory] = useState<StatKey>('k')

  const ranked = useMemo(
    () => rankPlayers(players, pitches, atBats ?? [], events, category),
    [players, pitches, atBats, events, category],
  )

  if (ranked.length === 0) {
    return (
      <p className="empty-copy">
        No pitches yet. Track a practice or game, then rankings will show up here.
      </p>
    )
  }

  const active = STAT_CATEGORIES.find((item) => item.id === category)

  return (
    <div className="team-stats">
      <div className="stat-chips" role="tablist" aria-label="Stat category">
        {STAT_CATEGORIES.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={item.id === category}
            className={item.id === category ? 'is-active' : ''}
            onClick={() => setCategory(item.id)}
          >
            {item.short}
          </button>
        ))}
      </div>
      <p className="scope-caption">{active?.label} · highest first</p>
      <ol className="rank-list">
        {ranked.map((row, index) => (
          <li key={row.player.id}>
            <button type="button" className="rank-row" onClick={() => onOpenPlayer(row.player.id)}>
              <span className="rank-place">{index + 1}</span>
              <span className="rank-name">{row.player.name}</span>
              <span className="rank-value">{formatStat(row.line, category)}</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  )
}
