import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { apiFetch } from '../http-client.js'
import { toToolError } from '../errors.js'
import { assertCardAllowed } from '../guards/ado-guard.js'

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
}
