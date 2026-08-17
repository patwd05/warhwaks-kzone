type AtBatStats = {
  number: number
  pitches: number
  strikes: number
  balls: number
  lastOutcome?: string | null
}

type Props = {
  pitches: number
  strikes: number
  balls: number
  atBat?: AtBatStats | null
}

export function StatsBar({ pitches, strikes, balls, atBat }: Props) {
  if (!atBat) {
    return (
      <div className="stats-bar">
        <Stat label="Pitches" value={pitches} />
        <Stat label="Strikes" value={strikes} accent="strike" />
        <Stat label="Balls" value={balls} accent="ball" />
      </div>
    )
  }

  return (
    <div className="stats-table" role="table" aria-label="Pitch totals">
      <div className="stats-table-head" role="row">
        <span />
        <span>Pitches</span>
        <span>Strikes</span>
        <span>Balls</span>
      </div>
      <div className="stats-table-row" role="row">
        <span className="stats-table-label">Overall</span>
        <span className="stat-value">{pitches}</span>
        <span className="stat-value stat--strike">{strikes}</span>
        <span className="stat-value stat--ball">{balls}</span>
      </div>
      <div className="stats-table-row stats-table-row--ab" role="row">
        <span className="stats-table-label">
          AB {atBat.number}
          {atBat.lastOutcome && atBat.pitches === 0 ? <em>Last {atBat.lastOutcome}</em> : null}
        </span>
        <span className="stat-value">{atBat.pitches}</span>
        <span className="stat-value stat--strike">{atBat.strikes}</span>
        <span className="stat-value stat--ball">{atBat.balls}</span>
      </div>
    </div>
  )
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string
  value: number
  accent?: 'strike' | 'ball'
}) {
  return (
    <div className={`stat ${accent ? `stat--${accent}` : ''}`}>
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  )
}
