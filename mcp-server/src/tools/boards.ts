import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { apiFetch } from '../http-client.js'
import { toToolError } from '../errors.js'
import { assertBoardAllowed, getAdoProtectedBoardId } from '../guards/ado-guard.js'

interface BoardSummary {
  id: number
  [key: string]: unknown
}

export function registerBoardTools(server: McpServer) {
  server.registerTool(
    'clicklocal_list_boards',
    {
      title: 'Listar boards',
      description: 'Lista todos os boards do ClickLocal (exceto o board gerenciado pela integração com Azure DevOps, que não é acessível via MCP).',
      inputSchema: {}
    },
    async () => {
      try {
        const boards = await apiFetch<BoardSummary[]>('/boards')
        const protectedBoardId = await getAdoProtectedBoardId()
        const visible = boards.filter(b => b.id !== protectedBoardId)
        return { content: [{ type: 'text', text: JSON.stringify(visible, null, 2) }] }
      } catch (err) {
        return toToolError(err)
      }
    }
  )

  server.registerTool(
    'clicklocal_get_board',
    {
      title: 'Obter board completo',
      description: 'Retorna um board com suas colunas e cards (não-arquivados).',
      inputSchema: {
        boardId: z.number().int().positive().describe('ID do board')
      }
    },
    async ({ boardId }) => {
      try {
        await assertBoardAllowed(boardId)
        const board = await apiFetch(`/boards/${boardId}/full`)
        return { content: [{ type: 'text', text: JSON.stringify(board, null, 2) }] }
      } catch (err) {
        return toToolError(err)
      }
    }
  )

  server.registerTool(
    'clicklocal_list_board_tags',
    {
      title: 'Listar tags do board',
      description: 'Lista as tags disponíveis em um board.',
      inputSchema: {
        boardId: z.number().int().positive().describe('ID do board')
      }
    },
    async ({ boardId }) => {
      try {
        await assertBoardAllowed(boardId)
        const tags = await apiFetch(`/boards/${boardId}/tags`)
        return { content: [{ type: 'text', text: JSON.stringify(tags, null, 2) }] }
      } catch (err) {
        return toToolError(err)
      }
    }
  )

  server.registerTool(
    'clicklocal_create_board_tag',
    {
      title: 'Criar tag no board',
      description: 'Cria uma nova tag em um board.',
      inputSchema: {
        boardId: z.number().int().positive().describe('ID do board'),
        name: z.string().min(1).describe('Nome da tag'),
        color: z.string().min(1).describe('Cor da tag (ex: hex #6d5ce8)')
      }
    },
    async ({ boardId, name, color }) => {
      try {
        await assertBoardAllowed(boardId)
        const tag = await apiFetch(`/boards/${boardId}/tags`, {
          method: 'POST',
          body: JSON.stringify({ name, color })
        })
        return { content: [{ type: 'text', text: JSON.stringify(tag, null, 2) }] }
      } catch (err) {
        return toToolError(err)
      }
    }
  )

  server.registerTool(
    'clicklocal_list_archived_cards',
    {
      title: 'Listar cards arquivados',
      description: 'Lista os cards arquivados de um board.',
      inputSchema: {
        boardId: z.number().int().positive().describe('ID do board')
      }
    },
    async ({ boardId }) => {
      try {
        await assertBoardAllowed(boardId)
        const cards = await apiFetch(`/boards/${boardId}/archived-cards`)
        return { content: [{ type: 'text', text: JSON.stringify(cards, null, 2) }] }
      } catch (err) {
        return toToolError(err)
      }
    }
  )
}
