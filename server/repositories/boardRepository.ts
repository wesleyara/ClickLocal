import type { Prisma } from '@prisma/client'
import { db } from '../utils/db'

export const boardRepository = {
  findMany() {
    return db.board.findMany({
      orderBy: { position: 'asc' },
      include: {
        _count: { select: { columns: true } },
        columns: { select: { _count: { select: { cards: true } } } }
      }
    })
  },

  findById(id: number) {
    return db.board.findUnique({ where: { id } })
  },

  findByIdWithColumnsAndCards(id: number) {
    return db.board.findUnique({
      where: { id },
      include: {
        columns: {
          orderBy: { position: 'asc' },
          include: {
            cards: {
              where: { archived: false, parentId: null },
              orderBy: { position: 'asc' },
              include: {
                subtasks: { select: { completed: true } },
                tags: { include: { tag: true } },
                timeEntries: { where: { endedAt: null }, select: { id: true, startedAt: true } },
                _count: { select: { children: { where: { archived: false } } } }
              }
            }
          }
        }
      }
    })
  },

  findArchivedCards(boardId: number) {
    return db.card.findMany({
      where: { archived: true, column: { boardId } },
      orderBy: { updatedAt: 'desc' },
      include: { column: { select: { name: true } } }
    })
  },

  findLastByPosition() {
    return db.board.findFirst({ orderBy: { position: 'desc' }, select: { position: true } })
  },

  create(data: Prisma.BoardCreateInput) {
    return db.board.create({ data })
  },

  update(id: number, data: Prisma.BoardUpdateInput) {
    return db.board.update({ where: { id }, data })
  },

  delete(id: number) {
    return db.board.delete({ where: { id } })
  }
}
