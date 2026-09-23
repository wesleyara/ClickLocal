import { azureDevOpsRepository } from '../../repositories/azureDevOpsRepository'
import { getWorkItemTypeFields, getWorkItemTypeStates } from '../../utils/azureDevOps'
import { db } from '../../utils/db'

const COMPLETED_WORK_FIELD = 'Microsoft.VSTS.Scheduling.CompletedWork'

export interface CachedWorkItemType {
  project: string
  name: string
  color: string | null
  states: { name: string, category: string, order: number }[]
  supportsCompletedWork: boolean
}

async function fetchAndCacheType(orgUrl: string, pat: string, project: string, type: string): Promise<CachedWorkItemType> {
  const [statesResult, fieldsResult] = await Promise.all([
    getWorkItemTypeStates(orgUrl, pat, project, type),
    getWorkItemTypeFields(orgUrl, pat, project, type)
  ])

  const states = statesResult.value.map(s => ({ name: s.name, category: s.category, order: s.order }))
  const supportsCompletedWork = fieldsResult.value.some(f => f.referenceName === COMPLETED_WORK_FIELD)

  await azureDevOpsRepository.upsertType(project, type, {
    color: null,
    statesJson: JSON.stringify(states),
    supportsCompletedWork,
    fetchedAt: new Date()
  })

  return { project, name: type, color: null, states, supportsCompletedWork }
}

/** Looks up the cache first; fetches from ADO and repopulates it on a miss. */
export async function resolveType(project: string, type: string): Promise<CachedWorkItemType> {
  const cached = await azureDevOpsRepository.findType(project, type)
  if (cached) {
    return {
      project,
      name: type,
      color: cached.color,
      states: JSON.parse(cached.statesJson),
      supportsCompletedWork: cached.supportsCompletedWork
    }
  }

  const connection = await azureDevOpsRepository.findConnection()
  if (!connection) throw new Error('Conexão com o Azure DevOps não configurada')

  return fetchAndCacheType(connection.orgUrl, connection.pat, project, type)
}

/** Renews every cached type from ADO — called once per manual sync. */
export async function refreshTypeCache() {
  const connection = await azureDevOpsRepository.findConnection()
  if (!connection) return

  const cached = await db.adoWorkItemType.findMany({ select: { project: true, name: true } })
  await Promise.all(cached.map(({ project, name }) => fetchAndCacheType(connection.orgUrl, connection.pat, project, name)))
}

/** First state (by order) belonging to the given category, or null if the type has none. */
export function stateForCategory(cached: CachedWorkItemType, category: string): string | null {
  const matches = cached.states.filter(s => s.category === category).sort((a, b) => a.order - b.order)
  return matches[0]?.name ?? null
}

export function supportsCompletedWork(cached: CachedWorkItemType): boolean {
  return cached.supportsCompletedWork
}
