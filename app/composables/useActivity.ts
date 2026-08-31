export interface ActivityEntry {
  id: number
  cardId: number
  eventType: string
  payload: Record<string, unknown> | null
  createdAt: string
}

export function useActivity(cardId: Ref<number | null>) {
  const entries = ref<ActivityEntry[]>([])

  async function refresh() {
    if (!cardId.value) {
      entries.value = []
      return
    }
    entries.value = await $fetch<ActivityEntry[]>(`/api/cards/${cardId.value}/activity`)
  }

  watch(cardId, refresh, { immediate: true })

  return { entries, refresh }
}
