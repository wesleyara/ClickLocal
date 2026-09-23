import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { apiFetch } from '../http-client.js'
import { toToolError } from '../errors.js'
import { assertBoardAllowed, assertCardAllowed, assertColumnAllowed } from '../guards/ado-guard.js'

interface BoardFullCard {
  id: number
  columnId: number
  archived?: boolean
  [key: string]: unknown
}

interface BoardFullColumn {
  id: number
  cards: BoardFullCard[]
  [key: string]: unknown
}

interface BoardFull {
  columns: BoardFullColumn[]
}

export function registerCardTools(server: McpServer) {
  server.registerTool(
    'clicklocal_list_cards',
    {
      title: 'Listar cards de um board',
      description: 'Lista os cards de um board, opcionalmente filtrando por coluna e incluindo arquivados.',
      inputSchema: {
        boardId: z.number().int().positive().describe('ID do board'),
        columnId: z.number().int().positive().optional().describe('Filtra apenas cards desta coluna'),
        includeArchived: z.boolean().optional().describe('Se true, inclui cards arquivados (padrão: false)')
      }
    },
    async ({ boardId, columnId, includeArchived }) => {
      try {
        await assertBoardAllowed(boardId)
        const full = await apiFetch<BoardFull>(`/boards/${boardId}/full`)
        let cards = full.columns.flatMap(c => c.cards.map(card => ({ ...card, columnId: c.id })))
        if (columnId !== undefined) cards = cards.filter(c => c.columnId === columnId)

        let archivedCards: BoardFullCard[] = []
        if (includeArchived) {
          archivedCards = await apiFetch<BoardFullCard[]>(`/boards/${boardId}/archived-cards`)
          if (columnId !== undefined) archivedCards = archivedCards.filter(c => c.columnId === columnId)
        }

        return { content: [{ type: 'text', text: JSON.stringify([...cards, ...archivedCards], null, 2) }] }
      } catch (err) {
        return toToolError(err)
      }
    }
  )

  server.registerTool(
    'clicklocal_get_card',
    {
      title: 'Obter card',
      description: 'Retorna os detalhes de um card (tags, filhos, vínculo com Azure DevOps se houver).',
      inputSchema: {
        cardId: z.number().int().positive().describe('ID do card')
      }
    },
    async ({ cardId }) => {
      try {
        const card = await assertCardAllowed(cardId)
        return { content: [{ type: 'text', text: JSON.stringify(card, null, 2) }] }
      } catch (err) {
        return toToolError(err)
      }
    }
  )

  server.registerTool(
    'clicklocal_create_card',
    {
      title: 'Criar card no backlog',
      description: 'Cria um novo card (item de backlog) em uma coluna de um board do ClickLocal.',
      inputSchema: {
        columnId: z.number().int().positive().describe('ID da coluna onde o card será criado'),
        title: z.string().min(1).describe('Título do card'),
        description: z.string().optional().describe('Descrição em markdown (opcional)')
      }
    },
    async ({ columnId, title, description }) => {
      try {
        await assertColumnAllowed(columnId)
        const card = await apiFetch('/cards', {
          method: 'POST',
          body: JSON.stringify({ columnId, title, description })
        })
        return { content: [{ type: 'text', text: JSON.stringify(card, null, 2) }] }
      } catch (err) {
        return toToolError(err)
      }
    }
  )

  server.registerTool(
    'clicklocal_create_child_card',
    {
      title: 'Criar sub-card',
      description: 'Cria um card filho vinculado a um card pai existente.',
      inputSchema: {
        parentCardId: z.number().int().positive().describe('ID do card pai'),
        title: z.string().min(1).describe('Título do card filho')
      }
    },
    async ({ parentCardId, title }) => {
      try {
        await assertCardAllowed(parentCardId)
        const card = await apiFetch(`/cards/${parentCardId}/children`, {
          method: 'POST',
          body: JSON.stringify({ title })
        })
        return { content: [{ type: 'text', text: JSON.stringify(card, null, 2) }] }
      } catch (err) {
        return toToolError(err)
      }
    }
  )

  server.registerTool(
    'clicklocal_update_card',
    {
      title: 'Atualizar card',
      description: 'Atualiza título, descrição, prazo, arquivamento ou move o card para outra coluna.',
      inputSchema: {
        cardId: z.number().int().positive().describe('ID do card'),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        columnId: z.number().int().positive().optional().describe('Mover o card para esta coluna'),
        dueDate: z.string().datetime().nullable().optional(),
        archived: z.boolean().optional()
      }
    },
    async ({ cardId, ...patch }) => {
      try {
        if (Object.keys(patch).length === 0) {
          throw new Error('Informe ao menos um campo para atualizar (title, description, columnId, dueDate ou archived).')
        }
        await assertCardAllowed(cardId)
        if (patch.columnId !== undefined) await assertColumnAllowed(patch.columnId)

        const card = await apiFetch(`/cards/${cardId}`, {
          method: 'PATCH',
          body: JSON.stringify(patch)
        })
        return { content: [{ type: 'text', text: JSON.stringify(card, null, 2) }] }
      } catch (err) {
        return toToolError(err)
      }
    }
  )

  server.registerTool(
    'clicklocal_delete_card',
    {
      title: 'Excluir card',
      description: 'Exclui um card. Falha se o card estiver vinculado a um work item do Azure DevOps (nesse caso, arquive em vez de excluir).',
      inputSchema: {
        cardId: z.number().int().positive().describe('ID do card')
      }
    },
    async ({ cardId }) => {
      try {
        await assertCardAllowed(cardId)
        await apiFetch(`/cards/${cardId}`, { method: 'DELETE' })
        return { content: [{ type: 'text', text: `Card ${cardId} excluído.` }] }
      } catch (err) {
        return toToolError(err)
      }
    }
  )
}
