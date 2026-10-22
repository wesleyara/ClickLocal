import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { apiFetch } from '../http-client.js'
import { toToolError } from '../errors.js'
import { assertBoardAllowed, assertColumnAllowed } from '../guards/ado-guard.js'

const POSITION_GAP = 1000

interface BoardFull {
  columns: { id: number }[]
}

export function registerColumnTools(server: McpServer) {
  server.registerTool(
    'clicklocal_create_column',
    {
      title: 'Criar coluna',
      description: 'Cria uma nova coluna no fim de um board.',
      inputSchema: {
        boardId: z.number().int().positive().describe('ID do board'),
        name: z.string().min(1).describe('Nome da coluna')
      }
    },
    async ({ boardId, name }) => {
      try {
        await assertBoardAllowed(boardId)
        const column = await apiFetch(`/boards/${boardId}/columns`, {
          method: 'POST',
          body: JSON.stringify({ name })
        })
        return { content: [{ type: 'text', text: JSON.stringify(column, null, 2) }] }
      } catch (err) {
        return toToolError(err)
      }
    }
  )

  server.registerTool(
    'clicklocal_update_column',
    {
      title: 'Atualizar coluna',
      description: 'Renomeia e/ou altera a cor de uma coluna.',
      inputSchema: {
        columnId: z.number().int().positive().describe('ID da coluna'),
        name: z.string().min(1).optional(),
        color: z.string().min(1).optional().describe('Cor (ex: hex #6d5ce8)')
      }
    },
    async ({ columnId, ...patch }) => {
      try {
        if (Object.keys(patch).length === 0) {
          throw new Error('Informe name e/ou color para atualizar.')
        }
        await assertColumnAllowed(columnId)
        const column = await apiFetch(`/columns/${columnId}`, {
          method: 'PATCH',
          body: JSON.stringify(patch)
        })
        return { content: [{ type: 'text', text: JSON.stringify(column, null, 2) }] }
      } catch (err) {
        return toToolError(err)
      }
    }
  )

  server.registerTool(
    'clicklocal_delete_column',
    {
      title: 'Excluir coluna',
      description: 'Exclui uma coluna. Atenção: os cards da coluna também são excluídos.',
      inputSchema: {
        columnId: z.number().int().positive().describe('ID da coluna')
      }
    },
    async ({ columnId }) => {
      try {
        await assertColumnAllowed(columnId)
        await apiFetch(`/columns/${columnId}`, { method: 'DELETE' })
        return { content: [{ type: 'text', text: `Coluna ${columnId} excluída.` }] }
      } catch (err) {
        return toToolError(err)
      }
    }
  )

  server.registerTool(
    'clicklocal_reorder_columns',
    {
      title: 'Reordenar colunas',
      description: 'Define a ordem das colunas de um board. Informe os IDs de TODAS as colunas do board na ordem desejada (da esquerda para a direita).',
      inputSchema: {
        boardId: z.number().int().positive().describe('ID do board'),
        orderedColumnIds: z.array(z.number().int().positive()).min(1).describe('IDs das colunas na nova ordem')
      }
    },
    async ({ boardId, orderedColumnIds }) => {
      try {
        await assertBoardAllowed(boardId)
        const full = await apiFetch<BoardFull>(`/boards/${boardId}/full`)
        const existing = full.columns.map(c => c.id)
        const sameSet = existing.length === orderedColumnIds.length
          && new Set(orderedColumnIds).size === orderedColumnIds.length
          && existing.every(id => orderedColumnIds.includes(id))
        if (!sameSet) {
          throw new Error(`orderedColumnIds deve conter exatamente as colunas do board, sem repetição: ${existing.join(', ')}.`)
        }

        await apiFetch(`/boards/${boardId}/columns/reorder`, {
          method: 'PATCH',
          body: JSON.stringify(orderedColumnIds.map((id, i) => ({ id, position: (i + 1) * POSITION_GAP })))
        })
        return { content: [{ type: 'text', text: `Colunas do board ${boardId} reordenadas: ${orderedColumnIds.join(', ')}.` }] }
      } catch (err) {
        return toToolError(err)
      }
    }
  )
}
