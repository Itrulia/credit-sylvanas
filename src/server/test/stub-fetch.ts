import { vi } from 'vitest'

export interface StubFile {
  body?: string
  etag?: string
  status?: number
}

/** Stub fetch keyed by path after the bucket host, e.g. 'forever/us/region/items.csv'. */
export function stubFetch(files: Record<string, StubFile | undefined>) {
  return vi.fn(async (url: string, init?: RequestInit) => {
    const path = url.replace('https://public-data.tradeskillmaster.com/', '')
    const file = files[path]
    if (!file) {
      return new Response('not found', { status: 404 })
    }
    const sent = new Headers(init?.headers).get('If-None-Match')
    if (file.etag && sent === file.etag && !file.status) {
      return new Response(null, { status: 304 })
    }
    return new Response(file.body ?? '', {
      status: file.status ?? 200,
      headers: file.etag ? { ETag: file.etag } : {},
    })
  })
}

export const sentEtag = (fn: ReturnType<typeof stubFetch>, call: number) =>
  new Headers(fn.mock.calls[call][1]?.headers).get('If-None-Match')
