import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { apiFetch } from '../http-client.js'
import { toToolError } from '../errors.js'
import { assertCardAllowed } from '../guards/ado-guard.js'

export function registerTimeEntryTools(server: McpServer) {
  server.registerTool(
    'clicklocal_list_time_entries',
    {
      title: 'Listar horas registradas',
      description: 'Lista os registros de tempo (horas) de um card.',
      inputSchema: {
        cardId: z.number().int().positive().describe('ID do card')
      }
    },
    async ({ cardId }) => {
      try {
        await assertCardAllowed(cardId)
        const entries = await apiFetch(`/cards/${cardId}/time-entries`)
        return { content: [{ type: 'text', text: JSON.stringify(entries, null, 2) }] }
      } catch (err) {
        return toToolError(err)
      }
    }
  )

  server.registerTool(
    'clicklocal_log_time_entry',
    {
      title: 'Registrar horas',
      description: 'Registra manualmente um período de tempo trabalhado em um card.',
      inputSchema: {
        cardId: z.number().int().positive().describe('ID do card'),
        startedAt: z.string().datetime().describe('Data/hora ISO de início do período'),
        durationMs: z.number().int().positive().describe('Duração em milissegundos'),
        note: z.string().optional().describe('Anotação opcional sobre o período')
      }
    },
    async ({ cardId, startedAt, durationMs, note }) => {
      try {
        await assertCardAllowed(cardId)
        const entry = await apiFetch(`/cards/${cardId}/time-entries`, {
          method: 'POST',
          body: JSON.stringify({ source: 'manual', startedAt, durationMs, note })
        })
        return { content: [{ type: 'text', text: JSON.stringify(entry, null, 2) }] }
      } catch (err) {
        return toToolError(err)
      }
    }
  )

  server.registerTool(
    'clicklocal_delete_time_entry',
    {
      title: 'Excluir registro de horas',
      description: 'Exclui um registro de tempo. Falha se as horas já tiverem sido enviadas ao Azure DevOps.',
      inputSchema: {
        cardId: z.number().int().positive().describe('ID do card dono do registro (usado apenas para verificar acesso, não é enviado à API)'),
        timeEntryId: z.number().int().positive().describe('ID do registro de tempo')
      }
    },
    async ({ cardId, timeEntryId }) => {
      try {
        await assertCardAllowed(cardId)
        await apiFetch(`/time-entries/${timeEntryId}`, { method: 'DELETE' })
        return { content: [{ type: 'text', text: `Registro de tempo ${timeEntryId} excluído.` }] }
      } catch (err) {
        return toToolError(err)
      }
    }
  )
}
