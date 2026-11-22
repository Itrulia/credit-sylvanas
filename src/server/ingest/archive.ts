import '@tanstack/react-start/server-only'

/** The part of R2Bucket ingest needs, so another host can hand in any store with this shape. */
export type ArchiveBucket = Pick<R2Bucket, 'put'>

export function archiveKey(
  region: string,
  updatedAtIso: string,
  realm?: string | null,
): string {
  return realm
    ? `forever/${region}/realm/${realm}/items/${updatedAtIso}.csv.gz`
    : `forever/${region}/region/items/${updatedAtIso}.csv.gz`
}

export async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(text),
  )
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

// Buffered on purpose: R2Bucket.put throws on a stream of unknown length.
export async function gzip(text: string): Promise<ArrayBuffer> {
  return new Response(
    new Blob([text]).stream().pipeThrough(new CompressionStream('gzip')),
  ).arrayBuffer()
}

/** Stores the raw file gzipped. No contentEncoding, so a later get returns the gzip bytes untouched. */
export async function archiveFile(
  bucket: ArchiveBucket,
  key: string,
  text: string,
) {
  await bucket.put(key, await gzip(text), {
    httpMetadata: { contentType: 'application/gzip' },
  })
}
