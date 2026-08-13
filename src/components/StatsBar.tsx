type Props = {
  pitches: number
  strikes: number
  balls: number
}

export function StatsBar({ pitches, strikes, balls }: Props) {
  return (
    <div className="stats-bar">
      <Stat label="Pitches" value={pitches} />
      <Stat label="Strikes" value={strikes} accent="strike" />
      <Stat label="Balls" value={balls} accent="ball" />
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
