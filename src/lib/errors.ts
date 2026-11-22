import { isNotFound, isRedirect } from '@tanstack/react-router'

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

// Whatever a server fn throws is serialised into the HTML (router and query
// state), so a D1 message like "no such table" would reach every visitor.
export function hideServerError(error: unknown): unknown {
  if (isRedirect(error) || isNotFound(error) || noDataRegion(error)) {
    return error
  }
  console.error(error)
  return new Error('Internal server error')
}
