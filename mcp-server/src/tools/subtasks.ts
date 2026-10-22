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

  server.registerTool(
    'clicklocal_reorder_subtasks',
    {
      title: 'Reordenar subtasks',
      description: 'Define a ordem das subtasks de um card. Informe os IDs de TODAS as subtasks do card na ordem desejada.',
      inputSchema: {
        cardId: z.number().int().positive().describe('ID do card'),
        orderedSubtaskIds: z.array(z.number().int().positive()).min(1).describe('IDs das subtasks na nova ordem')
      }
    },
    async ({ cardId, orderedSubtaskIds }) => {
      try {
        const card = await assertCardAllowed(cardId) as { subtasks?: { id: number }[] }
        const existing = (card.subtasks ?? []).map(s => s.id)
        const sameSet = existing.length === orderedSubtaskIds.length
          && new Set(orderedSubtaskIds).size === orderedSubtaskIds.length
          && existing.every(id => orderedSubtaskIds.includes(id))
        if (!sameSet) {
          throw new Error(`orderedSubtaskIds deve conter exatamente as subtasks do card, sem repetição: ${existing.join(', ')}.`)
        }

        await apiFetch('/subtasks/reorder', {
          method: 'PATCH',
          body: JSON.stringify(orderedSubtaskIds.map((id, i) => ({ id, position: (i + 1) * 1000 })))
        })
        return { content: [{ type: 'text', text: `Subtasks do card ${cardId} reordenadas: ${orderedSubtaskIds.join(', ')}.` }] }
      } catch (err) {
        return toToolError(err)
      }
    }
  )
}
