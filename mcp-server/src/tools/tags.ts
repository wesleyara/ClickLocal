import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { apiFetch } from '../http-client.js'
import { toToolError } from '../errors.js'
import { assertBoardAllowed, assertCardAllowed } from '../guards/ado-guard.js'

export function registerTagTools(server: McpServer) {
  server.registerTool(
    'clicklocal_attach_tag_to_card',
    {
      title: 'Adicionar tag a um card',
      description: 'Associa uma tag existente do board a um card.',
      inputSchema: {
        cardId: z.number().int().positive().describe('ID do card'),
        tagId: z.number().int().positive().describe('ID da tag')
      }
    },
    async ({ cardId, tagId }) => {
      try {
        await assertCardAllowed(cardId)
        const result = await apiFetch(`/cards/${cardId}/tags`, {
          method: 'POST',
          body: JSON.stringify({ tagId })
        })
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
      } catch (err) {
        return toToolError(err)
      }
    }
  )

  server.registerTool(
    'clicklocal_detach_tag_from_card',
    {
      title: 'Remover tag de um card',
      description: 'Remove a associação entre uma tag e um card.',
      inputSchema: {
        cardId: z.number().int().positive().describe('ID do card'),
        tagId: z.number().int().positive().describe('ID da tag')
      }
    },
    async ({ cardId, tagId }) => {
      try {
        await assertCardAllowed(cardId)
        await apiFetch(`/cards/${cardId}/tags/${tagId}`, { method: 'DELETE' })
        return { content: [{ type: 'text', text: `Tag ${tagId} removida do card ${cardId}.` }] }
      } catch (err) {
        return toToolError(err)
      }
    }
  )

  server.registerTool(
    'clicklocal_update_board_tag',
    {
      title: 'Atualizar tag do board',
      description: 'Renomeia e/ou altera a cor de uma tag.',
      inputSchema: {
        boardId: z.number().int().positive().describe('ID do board dono da tag'),
        tagId: z.number().int().positive().describe('ID da tag'),
        name: z.string().min(1).optional(),
        color: z.string().min(1).optional().describe('Cor (ex: hex #6d5ce8)')
      }
    },
    async ({ boardId, tagId, ...patch }) => {
      try {
        if (Object.keys(patch).length === 0) {
          throw new Error('Informe name e/ou color para atualizar.')
        }
        await assertBoardAllowed(boardId)
        await assertTagInBoard(boardId, tagId)
        const tag = await apiFetch(`/tags/${tagId}`, {
          method: 'PATCH',
          body: JSON.stringify(patch)
        })
        return { content: [{ type: 'text', text: JSON.stringify(tag, null, 2) }] }
      } catch (err) {
        return toToolError(err)
      }
    }
  )

  server.registerTool(
    'clicklocal_delete_board_tag',
    {
      title: 'Excluir tag do board',
      description: 'Exclui uma tag do board (ela é removida de todos os cards).',
      inputSchema: {
        boardId: z.number().int().positive().describe('ID do board dono da tag'),
        tagId: z.number().int().positive().describe('ID da tag')
      }
    },
    async ({ boardId, tagId }) => {
      try {
        await assertBoardAllowed(boardId)
        await assertTagInBoard(boardId, tagId)
        await apiFetch(`/tags/${tagId}`, { method: 'DELETE' })
        return { content: [{ type: 'text', text: `Tag ${tagId} excluída.` }] }
      } catch (err) {
        return toToolError(err)
      }
    }
  )
}

async function assertTagInBoard(boardId: number, tagId: number) {
  const tags = await apiFetch<{ id: number }[]>(`/boards/${boardId}/tags`)
  if (!tags.some(t => t.id === tagId)) {
    throw new Error(`A tag ${tagId} não pertence ao board ${boardId}.`)
  }
}
