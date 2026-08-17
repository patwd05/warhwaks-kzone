import { formatStat, type GameStatRow, type StatKey } from '../stats'

const COLUMNS: { key: StatKey; label: string; title: string }[] = [
  { key: 'pitches', label: 'P', title: 'Pitches' },
  { key: 'k', label: 'K', title: 'Strikeouts' },
  { key: 'kPct', label: 'K%', title: 'Strikeout %' },
  { key: 'walks', label: 'BB', title: 'Walks' },
  { key: 'walkPct', label: 'BB%', title: 'Walk %' },
  { key: 'strikePct', label: 'Str%', title: 'Strike %' },
  { key: 'ballPct', label: 'Ball%', title: 'Ball %' },
  { key: 'hitsPerAb', label: 'H/AB', title: 'Hits per at-bat' },
  { key: 'pitchesPerBatter', label: 'P/B', title: 'Pitches per batter' },
]

type Props = {
  rows: GameStatRow[]
}

export function PitcherStatsTable({ rows }: Props) {
  if (rows.length === 0) {
    return (
      <p className="empty-copy">
        No games yet. Start a game and mark at-bats to build this pitcher’s season table.
      </p>
    )
  }

  return (
    <div className="stats-scroll">
      <table className="pitcher-table">
        <thead>
          <tr>
            <th scope="col">Event</th>
            {COLUMNS.map((col) => (
              <th key={col.key} scope="col" title={col.title}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className={row.season ? 'is-season' : undefined}>
              <th scope="row">
                <span>{row.label}</span>
                <em>{row.sublabel}</em>
              </th>
              {COLUMNS.map((col) => (
                <td key={col.key}>{formatStat(row.line, col.key)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
