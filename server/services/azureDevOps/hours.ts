import { azureDevOpsRepository } from '../../repositories/azureDevOpsRepository'
import { adoWriteGuard, getWorkItemsBatch } from '../../utils/azureDevOps'
import { db } from '../../utils/db'
import { resolveType, supportsCompletedWork } from './types'

const COMPLETED_WORK_FIELD = 'Microsoft.VSTS.Scheduling.CompletedWork'

export interface PendingHoursCard {
  cardId: number
  cardTitle: string
  adoId: number
  project: string
  type: string
  supportsCompletedWork: boolean
  writeAllowed: boolean
  currentCompletedWork: number
  currentCompletedWorkKnown: boolean
  pendingHours: number
  entryCount: number
}

function msToHours(ms: number) {
  return Math.round((ms / 3_600_000) * 100) / 100
}

/** Time entries with hours not yet sent, grouped by linked card, with a live preview of the current `Completed Work`. */
export async function listPendingHours(): Promise<PendingHoursCard[]> {
  const entries = await db.timeEntry.findMany({
    where: { endedAt: { not: null }, adoPushedAt: null, card: { ado: { isNot: null } } },
    include: { card: { include: { ado: true } } }
  })
  if (entries.length === 0) return []

  const connection = await azureDevOpsRepository.findConnection()
  const allowedProjects: string[] = connection ? JSON.parse(connection.writeAllowedProjects) : []

  const byCard = new Map<number, PendingHoursCard>()
  for (const entry of entries) {
    const ado = entry.card.ado!
    let group = byCard.get(entry.cardId)
    if (!group) {
      const cached = await azureDevOpsRepository.findType(ado.project, ado.type)
      group = {
        cardId: entry.cardId,
        cardTitle: entry.card.title,
        adoId: ado.adoId,
        project: ado.project,
        type: ado.type,
        supportsCompletedWork: cached?.supportsCompletedWork ?? true,
        writeAllowed: allowedProjects.includes(ado.project),
        currentCompletedWork: 0,
        currentCompletedWorkKnown: false,
        pendingHours: 0,
        entryCount: 0
      }
      byCard.set(entry.cardId, group)
    }
    group.pendingHours = Math.round((group.pendingHours + msToHours(entry.durationMs ?? 0)) * 100) / 100
    group.entryCount++
  }

  if (connection) {
    const groups = Array.from(byCard.values())
    try {
      const { value } = await getWorkItemsBatch(connection.orgUrl, connection.pat, groups.map(g => g.adoId), ['System.Id', COMPLETED_WORK_FIELD])
      const currentByAdoId = new Map(value.map(item => [item.id, item.fields[COMPLETED_WORK_FIELD] ?? 0]))
      for (const group of groups) {
        const current = currentByAdoId.get(group.adoId)
        if (current !== undefined) {
          group.currentCompletedWork = current
          group.currentCompletedWorkKnown = true
        }
      }
    } catch {
      // ADO unreachable: still list what's pending locally, just without a live "current" preview.
    }
  }

  return Array.from(byCard.values())
}

export interface HoursPushResult {
  cardId: number
  success: boolean
  reason?: string
}

/** One GET-then-PATCH attempt; the caller retries once if it fails for a reason other than the guard's own allowlist checks. */
async function attemptPush(cardId: number, linked: { adoId: number, project: string }, hours: number, orgUrl: string, pat: string) {
  const { value } = await getWorkItemsBatch(orgUrl, pat, [linked.adoId], [COMPLETED_WORK_FIELD])
  const item = value[0]
  const current = item?.fields[COMPLETED_WORK_FIELD] ?? 0
  const rev = item?.rev
  if (rev === undefined) throw new Error('Item não encontrado no Azure DevOps')
  const next = Math.round((current + hours) * 100) / 100

  return adoWriteGuard({
    cardId,
    project: linked.project,
    adoId: linked.adoId,
    op: 'patchWorkItem',
    eventType: 'ado_hours_pushed',
    activityPayload: { from: current, to: next, hours },
    fields: [COMPLETED_WORK_FIELD],
    rev,
    patch: [{ op: 'add', path: `/fields/${COMPLETED_WORK_FIELD}`, value: next }]
  })
}

/** Sends each card's pending hours to `Completed Work`, via `adoWriteGuard`. Running timers are never included (they have no `endedAt`). */
export async function pushHours(cardIds: number[]): Promise<{ results: HoursPushResult[] }> {
  const results: HoursPushResult[] = []
  const connection = await azureDevOpsRepository.findConnection()
  if (!connection) {
    return { results: cardIds.map(cardId => ({ cardId, success: false, reason: 'Conexão com o Azure DevOps não configurada' })) }
  }
  if (connection.writeMode === 'readonly') {
    return { results: cardIds.map(cardId => ({ cardId, success: false, reason: 'Escrita desabilitada: a conexão está em modo Somente leitura' })) }
  }
  const allowedProjects: string[] = JSON.parse(connection.writeAllowedProjects)

  for (const cardId of cardIds) {
    try {
      const linked = await azureDevOpsRepository.findWorkItemByCardId(cardId)
      if (!linked) {
        results.push({ cardId, success: false, reason: 'Card não vinculado ao Azure DevOps' })
        continue
      }
      if (!allowedProjects.includes(linked.project)) {
        results.push({ cardId, success: false, reason: `Escrita não permitida no projeto "${linked.project}"` })
        continue
      }

      const cachedType = await resolveType(linked.project, linked.type)
      if (!supportsCompletedWork(cachedType)) {
        results.push({ cardId, success: false, reason: `${linked.type} não suporta Completed Work` })
        continue
      }

      const entries = await db.timeEntry.findMany({ where: { cardId, endedAt: { not: null }, adoPushedAt: null } })
      const pendingHours = msToHours(entries.reduce((sum, e) => sum + (e.durationMs ?? 0), 0))
      if (pendingHours <= 0) {
        results.push({ cardId, success: true })
        continue
      }

      let result
      try {
        result = await attemptPush(cardId, linked, pendingHours, connection.orgUrl, connection.pat)
      } catch (error) {
        if ((error as { statusCode?: number }).statusCode === 403) throw error
        result = await attemptPush(cardId, linked, pendingHours, connection.orgUrl, connection.pat)
      }

      if (!result.dryRun && result.workItem) {
        await db.$transaction(async (tx) => {
          await tx.timeEntry.updateMany({ where: { id: { in: entries.map(e => e.id) } }, data: { adoPushedAt: new Date() } })
          await azureDevOpsRepository.updateWorkItemByCardId(cardId, { rev: result!.workItem!.rev }, tx)
        })
      }

      results.push({ cardId, success: true })
    } catch (error) {
      const reason = (error as { statusMessage?: string, message?: string }).statusMessage
        ?? (error as Error).message
        ?? 'Falha desconhecida ao enviar horas'
      results.push({ cardId, success: false, reason })
    }
  }

  return { results }
}
