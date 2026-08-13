/** Layout as fractions of the field container (catcher's view). */
export const FIELD = {
  zone: { left: 0.29, top: 0.18, width: 0.42, height: 0.44 },
  plate: { left: 0.29, top: 0.62, width: 0.42, height: 0.2 },
  ballStart: { x: 0.5, y: 0.91 },
}

export function isInStrikeZone(x: number, y: number): boolean {
  const { left, top, width, height } = FIELD.zone
  return x >= left && x <= left + width && y >= top && y <= top + height
}

export function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n))
}
