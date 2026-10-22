import type { Prisma } from '@prisma/client'
import { db } from '../utils/db'

export interface TimeEntryFilter {
  from?: Date
  /** Exclusive upper bound. */
  to?: Date
  boardId?: number
  tagIds: number[]
}

export const reportRepository = {
  findTimeEntries({ from, to, boardId, tagIds }: TimeEntryFilter) {
    const startedAt: Prisma.DateTimeFilter = {}
    if (from) startedAt.gte = from
    if (to) startedAt.lt = to

    const card: Prisma.CardWhereInput = {}
    if (boardId !== undefined) card.column = { boardId }
    if (tagIds.length) card.tags = { some: { tagId: { in: tagIds } } }

    return db.timeEntry.findMany({
      where: { startedAt, card },
      orderBy: { startedAt: 'asc' },
      select: {
        startedAt: true,
        endedAt: true,
        durationMs: true,
        card: {
          select: {
            id: true,
            title: true,
            column: { select: { board: { select: { id: true, name: true } } } },
            tags: { select: { tag: { select: { id: true, name: true } } } }
          }
        }
      }
    })
  }
}
