// Business timezone helpers. The business operates in Asia/Dhaka (UTC+6, no DST),
// so day-boundary / day-key / "overdue" logic must key off the Dhaka calendar day
// regardless of the server's local timezone. Dependency-free fixed +6 offset.

const DHAKA_OFFSET_MS = 6 * 60 * 60 * 1000

/** Format an instant as its Asia/Dhaka calendar day, `YYYY-MM-DD`. */
export function dhakaDateStr(d: Date): string {
  const shifted = new Date(d.getTime() + DHAKA_OFFSET_MS)
  const y = shifted.getUTCFullYear()
  const m = String(shifted.getUTCMonth() + 1).padStart(2, '0')
  const day = String(shifted.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Today's Asia/Dhaka calendar day, `YYYY-MM-DD`. */
export function dhakaToday(): string {
  return dhakaDateStr(new Date())
}

/** The absolute instant of Asia/Dhaka midnight for a given `YYYY-MM-DD` day. */
export function dhakaDayStart(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000+06:00`)
}

/** The absolute instant of the last millisecond of an Asia/Dhaka `YYYY-MM-DD` day. */
export function dhakaDayEnd(dateStr: string): Date {
  return new Date(`${dateStr}T23:59:59.999+06:00`)
}
