import { db } from '../utils/db'
import { extractAttachmentIds, isPastGracePeriod } from '../utils/orphanAttachments'
import { deleteImage } from '../utils/storage'

async function findOrphans() {
  const [attachments, cards, comments] = await Promise.all([
    db.attachment.findMany({
      include: { card: { select: { id: true, title: true, column: { select: { board: { select: { id: true, name: true } } } } } } },
      orderBy: { createdAt: 'desc' }
    }),
    db.card.findMany({ select: { description: true } }),
    db.comment.findMany({ select: { body: true } })
  ])

  const referenced = extractAttachmentIds([...cards.map(c => c.description), ...comments.map(c => c.body)])
  return attachments.filter(a => !referenced.has(a.id) && isPastGracePeriod(a.createdAt))
}

export async function listOrphanAttachments() {
  const orphans = await findOrphans()
  return orphans.map(a => ({
    id: a.id,
    fileName: a.fileName,
    mimeType: a.mimeType,
    size: a.size,
    createdAt: a.createdAt,
    url: `/api/attachments/${a.id}`,
    card: { id: a.card.id, title: a.card.title },
    board: a.card.column.board
  }))
}

/** Deletes the chosen attachments for good. Ids that are no longer orphans (referenced meanwhile) are skipped. */
export async function deleteOrphanAttachments(ids: number[]) {
  const wanted = new Set(ids)
  const targets = (await findOrphans()).filter(a => wanted.has(a.id))

  await db.attachment.deleteMany({ where: { id: { in: targets.map(a => a.id) } } })
  await Promise.all(targets.map(a => deleteImage(a.storageKey)))

  return {
    deleted: targets.length,
    skipped: wanted.size - targets.length,
    freedBytes: targets.reduce((sum, a) => sum + a.size, 0)
  }
}
