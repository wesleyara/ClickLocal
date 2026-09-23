import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { apiFetch } from '../http-client.js'
import { toToolError } from '../errors.js'
import { assertCardAllowed } from '../guards/ado-guard.js'

export function registerSubtaskTools(server: McpServer) {
  server.registerTool(
    'clicklocal_create_subtask',
    {
      title: 'Criar subtask',
      description: 'Cria uma subtask (checklist item) em um card.',
      inputSchema: {
        cardId: z.number().int().positive().describe('ID do card'),
        title: z.string().min(1).describe('Título da subtask')
      }
    },
    async ({ cardId, title }) => {
      try {
        await assertCardAllowed(cardId)
        const subtask = await apiFetch(`/cards/${cardId}/subtasks`, {
          method: 'POST',
          body: JSON.stringify({ title })
        })
        return { content: [{ type: 'text', text: JSON.stringify(subtask, null, 2) }] }
      } catch (err) {
        return toToolError(err)
      }
    }
  )

  server.registerTool(
    'clicklocal_update_subtask',
    {
      title: 'Atualizar subtask',
      description: 'Renomeia e/ou marca como concluída uma subtask.',
      inputSchema: {
        cardId: z.number().int().positive().describe('ID do card dono da subtask (usado apenas para verificar acesso, não é enviado à API)'),
        subtaskId: z.number().int().positive().describe('ID da subtask'),
        title: z.string().min(1).optional(),
        completed: z.boolean().optional()
      }
    },
    async ({ cardId, subtaskId, ...patch }) => {
      try {
        if (Object.keys(patch).length === 0) {
          throw new Error('Informe title e/ou completed para atualizar.')
        }
        await assertCardAllowed(cardId)
        const subtask = await apiFetch(`/subtasks/${subtaskId}`, {
          method: 'PATCH',
          body: JSON.stringify(patch)
        })
        return { content: [{ type: 'text', text: JSON.stringify(subtask, null, 2) }] }
      } catch (err) {
        return toToolError(err)
      }
    }
  )

  server.registerTool(
    'clicklocal_delete_subtask',
    {
      title: 'Excluir subtask',
      description: 'Exclui uma subtask de um card.',
      inputSchema: {
        cardId: z.number().int().positive().describe('ID do card dono da subtask (usado apenas para verificar acesso, não é enviado à API)'),
        subtaskId: z.number().int().positive().describe('ID da subtask')
      }
    },
    async ({ cardId, subtaskId }) => {
      try {
        await assertCardAllowed(cardId)
        await apiFetch(`/subtasks/${subtaskId}`, { method: 'DELETE' })
        return { content: [{ type: 'text', text: `Subtask ${subtaskId} excluída.` }] }
      } catch (err) {
        return toToolError(err)
      }
    }
  )
}
