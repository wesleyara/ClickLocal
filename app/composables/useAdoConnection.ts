export interface AdoConnection {
  id: number
  orgUrl: string
  writeMode: 'readonly' | 'dry-run' | 'write'
  writeAllowedProjects: string[]
  boardId: number | null
  userName: string | null
  lastSyncedAt: string | null
  hasPat: boolean
}

export function useAdoConnection() {
  const connection = ref<AdoConnection | null>(null)
  const pending = ref(false)

  async function refresh() {
    pending.value = true
    try {
      connection.value = await $fetch<AdoConnection | null>('/api/integrations/azure-devops')
    } finally {
      pending.value = false
    }
  }

  function workItemUrl(project: string, adoId: number) {
    if (!connection.value) return null
    return `${connection.value.orgUrl}/${encodeURIComponent(project)}/_workitems/edit/${adoId}`
  }

  return { connection, pending, refresh, workItemUrl }
}
