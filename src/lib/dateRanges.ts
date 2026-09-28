export type PeriodPreset = 'today' | 'week' | 'month' | 'year'

/** Format a Date as YYYY-MM-DD in the device's local timezone (not UTC). */
export const toLocalDateStr = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/**
 * Full calendar period containing `now`, as local Date objects:
 * - today: 00:00 → 23:59:59.999 today
 * - week:  Monday 00:00 → Sunday 23:59:59.999
 * - month: 1st 00:00 → last day (28/29/30/31) 23:59:59.999
 * - year:  Jan 1 00:00 → Dec 31 23:59:59.999
 */
export function getPeriodBounds(preset: PeriodPreset, now: Date = new Date()): { start: Date; end: Date } {
  const y = now.getFullYear()
  const m = now.getMonth()
  const d = now.getDate()
  if (preset === 'week') {
    const mondayOffset = (now.getDay() + 6) % 7 // Monday = 0 … Sunday = 6
    return {
      start: new Date(y, m, d - mondayOffset),
      end: new Date(y, m, d - mondayOffset + 6, 23, 59, 59, 999),
    }
  }
  if (preset === 'month') {
    return { start: new Date(y, m, 1), end: new Date(y, m + 1, 0, 23, 59, 59, 999) }
  }
  if (preset === 'year') {
    return { start: new Date(y, 0, 1), end: new Date(y, 11, 31, 23, 59, 59, 999) }
  }
  return { start: new Date(y, m, d), end: new Date(y, m, d, 23, 59, 59, 999) }
}

/** Same as getPeriodBounds, but as inclusive YYYY-MM-DD strings for date inputs / filters. */
export function getPeriodRange(preset: PeriodPreset, now: Date = new Date()): { from: string; to: string } {
  const { start, end } = getPeriodBounds(preset, now)
  return { from: toLocalDateStr(start), to: toLocalDateStr(end) }
}
