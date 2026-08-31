export interface BoardSummary {
  id: number
  name: string
  description: string | null
  position: number
  createdAt: string
  updatedAt: string
  columnCount: number
  cardCount: number
}

export function useBoards() {
  const boards = ref<BoardSummary[]>([])
  const pending = ref(false)

  async function refresh() {
    pending.value = true
    try {
      boards.value = await $fetch<BoardSummary[]>('/api/boards')
    } finally {
      pending.value = false
    }
  }

  async function createBoard(input: { name: string, description?: string }) {
    const board = await $fetch<BoardSummary>('/api/boards', { method: 'POST', body: input })
    await refresh()
    return board
  }

  async function deleteBoard(id: number) {
    await $fetch(`/api/boards/${id}`, { method: 'DELETE' })
    boards.value = boards.value.filter(b => b.id !== id)
  }

  return { boards, pending, refresh, createBoard, deleteBoard }
}
