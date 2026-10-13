import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { apiFetch } from '../http-client.js'
import { toToolError } from '../errors.js'
import { assertCardAllowed } from '../guards/ado-guard.js'

export function registerCommentTools(server: McpServer) {
  server.registerTool(
    'clicklocal_list_comments',
    {
      title: 'Listar comentários',
      description: 'Lista os comentários de um card.',
      inputSchema: {
        cardId: z.number().int().positive().describe('ID do card')
      }
    },
    async ({ cardId }) => {
      try {
        await assertCardAllowed(cardId)
        const comments = await apiFetch(`/cards/${cardId}/comments`)
        return { content: [{ type: 'text', text: JSON.stringify(comments, null, 2) }] }
      } catch (err) {
        return toToolError(err)
      }
    }
  )

  server.registerTool(
    'clicklocal_add_comment',
    {
      title: 'Adicionar comentário',
      description: 'Adiciona um comentário em markdown a um card.',
      inputSchema: {
        cardId: z.number().int().positive().describe('ID do card'),
        body: z.string().min(1).describe('Conteúdo do comentário (markdown)')
      }
    },
    async ({ cardId, body }) => {
      try {
        await assertCardAllowed(cardId)
        const comment = await apiFetch(`/cards/${cardId}/comments`, {
          method: 'POST',
          body: JSON.stringify({ body })
        })
        return { content: [{ type: 'text', text: JSON.stringify(comment, null, 2) }] }
      } catch (err) {
        return toToolError(err)
      }
    }
  )

  server.registerTool(
    'clicklocal_update_comment',
    {
      title: 'Editar comentário',
      description: 'Edita o conteúdo de um comentário existente.',
      inputSchema: {
        cardId: z.number().int().positive().describe('ID do card dono do comentário (usado apenas para verificar acesso, não é enviado à API)'),
        commentId: z.number().int().positive().describe('ID do comentário'),
        body: z.string().min(1).describe('Novo conteúdo do comentário (markdown)')
      }
    },
    async ({ cardId, commentId, body }) => {
      try {
        await assertCardAllowed(cardId)
        const comment = await apiFetch(`/comments/${commentId}`, {
          method: 'PATCH',
          body: JSON.stringify({ body })
        })
        return { content: [{ type: 'text', text: JSON.stringify(comment, null, 2) }] }
      } catch (err) {
        return toToolError(err)
      }
    }
  )

  server.registerTool(
    'clicklocal_delete_comment',
    {
      title: 'Excluir comentário',
      description: 'Exclui um comentário de um card.',
      inputSchema: {
        cardId: z.number().int().positive().describe('ID do card dono do comentário (usado apenas para verificar acesso, não é enviado à API)'),
        commentId: z.number().int().positive().describe('ID do comentário')
      }
    },
    async ({ cardId, commentId }) => {
      try {
        await assertCardAllowed(cardId)
        await apiFetch(`/comments/${commentId}`, { method: 'DELETE' })
        return { content: [{ type: 'text', text: `Comentário ${commentId} excluído.` }] }
      } catch (err) {
        return toToolError(err)
      }
    }
  )
}
