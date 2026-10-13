import type { AdoWorkItem } from '../../utils/azureDevOps'
import { azureDevOpsRepository } from '../../repositories/azureDevOpsRepository'
import { cardRepository } from '../../repositories/cardRepository'
import { logActivity } from '../../utils/activity'
import { getWorkItemsBatch, wiql } from '../../utils/azureDevOps'
import { db } from '../../utils/db'
import { nextPosition } from '../../utils/position'
import { refreshTypeCache, resolveType } from './types'

const FIELDS = [
  'System.Id',
  'System.Title',
  'System.WorkItemType',
  'System.State',
  'System.TeamProject',
  'System.AssignedTo',
  'System.Description',
  'System.Parent'
]

const OUT_OF_SCOPE_CATEGORIES = new Set(['Completed', 'Removed'])

export interface SyncResult {
  created: number
  updated: number
  moved: number
  archived: number
  unarchived: number
}

interface ResolvedItem {
  item: AdoWorkItem
  category: string
  inScope: boolean
}

/** Runs the manual "Sincronizar" flow: discover, resolve, apply, all inside one transaction. */
export async function syncNow(): Promise<SyncResult> {
  const connection = await azureDevOpsRepository.findConnection()
  if (!connection) throw new Error('Conexão com o Azure DevOps não configurada')
  if (!connection.boardId) throw new Error('Board da integração não encontrado')

  await refreshTypeCache()

  const excluded = ['Closed', 'Done', 'Removed', 'Completed'].map(s => `'${s}'`).join(', ')
  const { workItems: assigned } = await wiql(
    connection.orgUrl,
    connection.pat,
    `SELECT [System.Id] FROM WorkItems WHERE [System.AssignedTo] = @Me AND [System.State] NOT IN (${excluded})`
  )
  const assignedIds = new Set(assigned.map(w => w.id))

  const linkedWorkItems = await azureDevOpsRepository.findAllWorkItems()
  const linkedByAdoId = new Map(linkedWorkItems.map(w => [w.adoId, w]))

  const allIds = Array.from(new Set([...assignedIds, ...linkedByAdoId.keys()]))
  const { value: items } = await getWorkItemsBatch(connection.orgUrl, connection.pat, allIds, FIELDS)

  const resolved: ResolvedItem[] = await Promise.all(items.map(async (item) => {
    const cached = await resolveType(item.fields['System.TeamProject'], item.fields['System.WorkItemType'])
    const category = cached.states.find(s => s.name === item.fields['System.State'])?.category ?? 'Proposed'
    const inScope = assignedIds.has(item.id) && !OUT_OF_SCOPE_CATEGORIES.has(category)
    return { item, category, inScope }
  }))

  const parentIds = Array.from(new Set(
    resolved.map(r => r.item.fields['System.Parent']).filter((id): id is number => typeof id === 'number')
  )).filter(id => !items.some(item => item.id === id))
  const { value: parents } = await getWorkItemsBatch(connection.orgUrl, connection.pat, parentIds, FIELDS)
  const parentById = new Map(parents.map(p => [p.id, p]))

  const columns = await db.boardColumn.findMany({
    where: { boardId: connection.boardId },
    orderBy: { position: 'asc' }
  })
  const firstColumnForCategory = (category: string) => columns.find(c => c.adoStateCategory === category)
  const columnById = new Map(columns.map(c => [c.id, c]))

  const result: SyncResult = { created: 0, updated: 0, moved: 0, archived: 0, unarchived: 0 }

  await db.$transaction(async (tx) => {
    for (const { item, category, inScope } of resolved) {
      const existing = linkedByAdoId.get(item.id)
      const parent = typeof item.fields['System.Parent'] === 'number' ? parentById.get(item.fields['System.Parent']) : undefined
      const descriptionHtml = item.fields['System.Description'] ?? null
      const project = item.fields['System.TeamProject']

      if (!existing) {
        if (!inScope) continue

        const targetColumn = firstColumnForCategory(category) ?? columns[0]
        if (!targetColumn) continue

        const last = await cardRepository.findLastByPosition(targetColumn.id)
        const card = await cardRepository.create({
          title: item.fields['System.Title'],
          position: nextPosition(last?.position),
          column: { connect: { id: targetColumn.id } }
        }, tx)

        await azureDevOpsRepository.createWorkItem({
          card: { connect: { id: card.id } },
          adoId: item.id,
          rev: item.rev,
          project,
          type: item.fields['System.WorkItemType'],
          state: item.fields['System.State'],
          stateCategory: category,
          descriptionHtml,
          url: item.url,
          parentAdoId: parent?.id ?? null,
          parentTitle: parent?.fields['System.Title'] ?? null,
          parentType: parent?.fields['System.WorkItemType'] ?? null,
          archivedBySync: false,
          syncedAt: new Date()
        }, tx)

        await logActivity(card.id, 'ado_synced_changes', { action: 'created', adoId: item.id }, tx)
        result.created++
        continue
      }

      const card = await cardRepository.findById(existing.cardId)
      if (!card) continue

      const currentColumn = columnById.get(card.columnId)
      const categoryChanged = category !== existing.stateCategory
      let moved = false

      if (inScope && categoryChanged && currentColumn?.adoStateCategory) {
        const targetColumn = firstColumnForCategory(category)
        if (targetColumn && targetColumn.id !== card.columnId) {
          const last = await cardRepository.findLastByPosition(targetColumn.id)
          await cardRepository.update(card.id, {
            column: { connect: { id: targetColumn.id } },
            position: nextPosition(last?.position)
          }, tx)
          await logActivity(card.id, 'moved_column', { fromColumnId: card.columnId, toColumnId: targetColumn.id }, tx)
          moved = true
        }
      }

      await cardRepository.update(card.id, { title: item.fields['System.Title'] }, tx)

      await azureDevOpsRepository.updateWorkItemByCardId(card.id, {
        rev: item.rev,
        state: item.fields['System.State'],
        stateCategory: category,
        descriptionHtml,
        url: item.url,
        parentAdoId: parent?.id ?? null,
        parentTitle: parent?.fields['System.Title'] ?? null,
        parentType: parent?.fields['System.WorkItemType'] ?? null,
        syncedAt: new Date()
      }, tx)

      if (!inScope && !card.archived) {
        await cardRepository.update(card.id, { archived: true }, tx)
        await azureDevOpsRepository.updateWorkItemByCardId(card.id, { archivedBySync: true }, tx)
        await logActivity(card.id, 'card_archived', undefined, tx)
        result.archived++
      } else if (inScope && card.archived && existing.archivedBySync) {
        await cardRepository.update(card.id, { archived: false }, tx)
        await azureDevOpsRepository.updateWorkItemByCardId(card.id, { archivedBySync: false }, tx)
        await logActivity(card.id, 'card_unarchived', undefined, tx)
        result.unarchived++
      }

      await logActivity(card.id, 'ado_synced_changes', { action: 'updated', adoId: item.id }, tx)
      result.updated++
      if (moved) result.moved++
    }
  })

  await azureDevOpsRepository.updateConnection({ lastSyncedAt: new Date() })

  return result
}
