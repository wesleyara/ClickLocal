import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { apiFetch } from '../http-client.js'
import { toToolError } from '../errors.js'
import { assertBoardAllowed } from '../guards/ado-guard.js'

export function registerTemplateTools(server: McpServer) {
  server.registerTool(
    'clicklocal_list_board_templates',
    {
      title: 'Listar templates de board',
      description: 'Lista os templates de board (nativos e personalizados) que podem ser usados em clicklocal_create_board.',
      inputSchema: {}
    },
    async () => {
      try {
        const templates = await apiFetch('/board-templates')
        return { content: [{ type: 'text', text: JSON.stringify(templates, null, 2) }] }
      } catch (err) {
        return toToolError(err)
      }
    }
  )

  server.registerTool(
    'clicklocal_create_board_template',
    {
      title: 'Salvar board como template',
      description: 'Cria um template personalizado a partir da estrutura (colunas) de um board existente.',
      inputSchema: {
        boardId: z.number().int().positive().describe('ID do board de origem'),
        name: z.string().min(1).describe('Nome do template')
      }
    },
    async ({ boardId, name }) => {
      try {
        await assertBoardAllowed(boardId)
        const template = await apiFetch('/board-templates', {
          method: 'POST',
          body: JSON.stringify({ boardId, name })
        })
        return { content: [{ type: 'text', text: JSON.stringify(template, null, 2) }] }
      } catch (err) {
        return toToolError(err)
      }
    }
  )

  server.registerTool(
    'clicklocal_delete_board_template',
    {
      title: 'Excluir template de board',
      description: 'Exclui um template personalizado. Templates nativos não podem ser excluídos.',
      inputSchema: {
        templateId: z.string().min(1).describe('ID do template')
      }
    },
    async ({ templateId }) => {
      try {
        await apiFetch(`/board-templates/${encodeURIComponent(templateId)}`, { method: 'DELETE' })
        return { content: [{ type: 'text', text: `Template ${templateId} excluído.` }] }
      } catch (err) {
        return toToolError(err)
      }
    }
  )
}
