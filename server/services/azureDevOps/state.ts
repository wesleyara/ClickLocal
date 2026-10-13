import type { DbClient } from '../../utils/db'
import { azureDevOpsRepository } from '../../repositories/azureDevOpsRepository'
import { adoWriteGuard } from '../../utils/azureDevOps'
import { db } from '../../utils/db'
import { resolveType, stateForCategory } from './types'

export interface CardMove {
  cardId: number
  fromColumnId: number
  toColumnId: number
}

export interface StateFailure {
  cardId: number
  reason: string
}

/**
 * For each move into a column mapped to an ADO state category, pushes the
 * concrete state to Azure DevOps via `adoWriteGuard`. Moves of unlinked
 * cards, moves within the same column, and moves into unmapped columns
 * never touch the ADO API.
 */
export async function pushStateForMoves(moves: CardMove[], client: DbClient = db): Promise<{ failures: StateFailure[] }> {
  const failures: StateFailure[] = []
  const changedMoves = moves.filter(m => m.fromColumnId !== m.toColumnId)
  if (changedMoves.length === 0) return { failures }

  const toColumnIds = Array.from(new Set(changedMoves.map(m => m.toColumnId)))
  const columns = await db.boardColumn.findMany({ where: { id: { in: toColumnIds } } })
  const columnById = new Map(columns.map(c => [c.id, c]))

  for (const move of changedMoves) {
    const targetColumn = columnById.get(move.toColumnId)
    if (!targetColumn?.adoStateCategory) continue

    const linked = await azureDevOpsRepository.findWorkItemByCardId(move.cardId)
    if (!linked) continue
    if (linked.stateCategory === targetColumn.adoStateCategory) continue

    try {
      const cached = await resolveType(linked.project, linked.type)
      const targetState = stateForCategory(cached, targetColumn.adoStateCategory)
      if (!targetState) {
        failures.push({ cardId: move.cardId, reason: `Nenhum estado de "${targetColumn.adoStateCategory}" no tipo ${linked.type}` })
        continue
      }
      if (targetState === linked.state) continue

      const result = await adoWriteGuard({
        cardId: move.cardId,
        project: linked.project,
        adoId: linked.adoId,
        op: 'patchWorkItem',
        eventType: 'ado_state_pushed',
        activityPayload: { from: linked.state, to: targetState },
        fields: ['System.State'],
        rev: linked.rev,
        patch: [{ op: 'replace', path: '/fields/System.State', value: targetState }]
      }, client)

      if (!result.dryRun && result.workItem) {
        await azureDevOpsRepository.updateWorkItemByCardId(move.cardId, {
          state: result.workItem.fields['System.State'],
          stateCategory: targetColumn.adoStateCategory,
          rev: result.workItem.rev
        }, client)
      }
    } catch (error) {
      const reason = (error as { statusMessage?: string, message?: string }).statusMessage
        ?? (error as Error).message
        ?? 'Falha desconhecida ao atualizar o estado no Azure DevOps'
      failures.push({ cardId: move.cardId, reason })
    }
  }

  return { failures }
}
