// Thrown by $region when D1 has no import for the region. Errors lose their
// class across the SSR boundary, so the message carries the marker.
const PREFIX = 'NO_DATA:'

export const noDataError = (region: string) => new Error(`${PREFIX}${region}`)

export function noDataRegion(error: unknown): string | null {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'object' && error && 'message' in error
        ? String(error.message)
        : ''
  return message.startsWith(PREFIX) ? message.slice(PREFIX.length) : null
}
