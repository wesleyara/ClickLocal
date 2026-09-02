export interface BoardTag {
  id: number
  boardId: number
  name: string
  color: string
}

export interface BoardCard {
  id: number
  columnId: number
  title: string
  description: string | null
  position: number
  dueDate: string | null
  archived: boolean
  subtaskCount: number
  subtaskDoneCount: number
  childCount: number
  tags: BoardTag[]
  hasRunningTimer: boolean
  runningTimerStartedAt: string | null
}

export interface BoardColumnWithCards {
  id: number
  boardId: number
  name: string
  color: string
  position: number
  cards: BoardCard[]
}

interface BoardInfo {
  id: number
  name: string
  description: string | null
}

export const useBoardStore = defineStore('board', {
  state: () => ({
    board: null as BoardInfo | null,
    columns: [] as BoardColumnWithCards[],
    loading: false
  }),

  actions: {
    async loadBoard(id: number) {
      this.loading = true
      try {
        const result = await $fetch<{ board: BoardInfo, columns: BoardColumnWithCards[] }>(`/api/boards/${id}/full`)
        this.board = result.board
        this.columns = result.columns
      } finally {
        this.loading = false
      }
    },

    async createColumn(name: string) {
      if (!this.board) return
      const column = await $fetch<BoardColumnWithCards>(`/api/boards/${this.board.id}/columns`, {
        method: 'POST',
        body: { name }
      })
      this.columns.push({ ...column, cards: [] })
    },

    async updateColumn(id: number, input: { name?: string, color?: string }) {
      await $fetch(`/api/columns/${id}`, { method: 'PATCH', body: input })
      const column = this.columns.find(c => c.id === id)
      if (column) Object.assign(column, input)
    },

    async deleteColumn(id: number) {
      await $fetch(`/api/columns/${id}`, { method: 'DELETE' })
      this.columns = this.columns.filter(c => c.id !== id)
    },

    async createCard(columnId: number, title: string) {
      const card = await $fetch<Omit<BoardCard, 'subtaskCount' | 'subtaskDoneCount' | 'childCount' | 'tags' | 'hasRunningTimer' | 'runningTimerStartedAt'>>('/api/cards', {
        method: 'POST',
        body: { columnId, title }
      })
      const column = this.columns.find(c => c.id === columnId)
      if (column) column.cards.push({ ...card, subtaskCount: 0, subtaskDoneCount: 0, childCount: 0, tags: [], hasRunningTimer: false, runningTimerStartedAt: null })
    },

    async deleteCard(id: number) {
      await $fetch(`/api/cards/${id}`, { method: 'DELETE' })
      for (const column of this.columns) {
        column.cards = column.cards.filter(c => c.id !== id)
      }
    },

    /** Recompute positions from current in-memory (post-drag) order and persist all of them. */
    async persistCardOrder() {
      const updates = this.columns.flatMap(column =>
        column.cards.map((card, index) => {
          card.columnId = column.id
          card.position = (index + 1) * 1000
          return { id: card.id, columnId: column.id, position: card.position }
        })
      )
      if (updates.length === 0) return
      await $fetch('/api/cards/reorder', { method: 'PATCH', body: updates })
    },

    async persistColumnOrder() {
      const updates = this.columns.map((column, index) => {
        column.position = (index + 1) * 1000
        return { id: column.id, position: column.position }
      })
      if (!this.board || updates.length === 0) return
      await $fetch(`/api/boards/${this.board.id}/columns/reorder`, { method: 'PATCH', body: updates })
    }
  }
})
