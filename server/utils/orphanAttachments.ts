const ATTACHMENT_URL = /\/api\/attachments\/(\d+)/g

/** Attachments younger than this are never reported: their image may sit in an editor that wasn't saved yet. */
export const ORPHAN_GRACE_MS = 24 * 60 * 60 * 1000

/** Ids of every attachment linked (as `/api/attachments/<id>`) from the given Markdown texts. */
export function extractAttachmentIds(texts: (string | null | undefined)[]) {
  const ids = new Set<number>()
  for (const text of texts) {
    if (!text) continue
    for (const match of text.matchAll(ATTACHMENT_URL)) ids.add(Number(match[1]))
  }
  return ids
}

export function isPastGracePeriod(createdAt: Date, now = Date.now()) {
  return now - createdAt.getTime() >= ORPHAN_GRACE_MS
}
