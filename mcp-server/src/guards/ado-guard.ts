import { apiFetch } from '../http-client.js'
import { AdoBoardBlockedError } from '../errors.js'

interface AzureDevOpsConnection {
  boardId: number | null
}

interface BoardFullColumn {
  id: number
}

interface BoardFull {
  columns: BoardFullColumn[]
}

interface Card {
  id: number
  columnId: number
}

async function loadAdoProtectedScope(): Promise<{ boardId: number | null, columnIds: Set<number> }> {
  const conn = await apiFetch<AzureDevOpsConnection | null>('/integrations/azure-devops')
  const boardId = conn?.boardId ?? null
  if (boardId == null) return { boardId: null, columnIds: new Set<number>() }

  const full = await apiFetch<BoardFull>(`/boards/${boardId}/full`)
  return { boardId, columnIds: new Set(full.columns.map(c => c.id)) }
}

export async function getAdoProtectedBoardId(): Promise<number | null> {
  const scope = await loadAdoProtectedScope()
  return scope.boardId
}

export async function assertBoardAllowed(boardId: number): Promise<void> {
  const scope = await loadAdoProtectedScope()
  if (scope.boardId === boardId) throw new AdoBoardBlockedError()
}

export async function assertColumnAllowed(columnId: number): Promise<void> {
  const scope = await loadAdoProtectedScope()
  if (scope.columnIds.has(columnId)) throw new AdoBoardBlockedError()
}

export async function assertCardAllowed(cardId: number): Promise<Card> {
  const card = await apiFetch<Card>(`/cards/${cardId}`)
  await assertColumnAllowed(card.columnId)
  return card
}
