export interface TimeEntry {
  id: number
  cardId: number
  startedAt: string
  endedAt: string | null
  durationMs: number | null
  source: 'timer' | 'manual'
  note: string | null
}

function storageKey(cardId: number) {
  return `clicklocal:timer:${cardId}`
}

function persistRunning(cardId: number, entry: { id: number, startedAt: string } | null) {
  if (!import.meta.client) return
  if (entry) {
    localStorage.setItem(storageKey(cardId), JSON.stringify({ entryId: entry.id, startedAt: entry.startedAt }))
  } else {
    localStorage.removeItem(storageKey(cardId))
  }
}

export function useTimer(cardId: Ref<number | null>) {
  const entries = ref<TimeEntry[]>([])
  const runningEntry = ref<TimeEntry | null>(null)
  const now = ref(Date.now())

  let tickInterval: ReturnType<typeof setInterval> | undefined

  const elapsedMs = computed(() => {
    if (!runningEntry.value) return 0
    return now.value - new Date(runningEntry.value.startedAt).getTime()
  })

  const totalMs = computed(() => {
    const stoppedTotal = entries.value
      .filter(e => e.durationMs !== null)
      .reduce((sum, e) => sum + (e.durationMs ?? 0), 0)
    return stoppedTotal + elapsedMs.value
  })

  function startTicking() {
    if (tickInterval) return
    tickInterval = setInterval(() => {
      now.value = Date.now()
    }, 1000)
  }

  function stopTicking() {
    clearInterval(tickInterval)
    tickInterval = undefined
  }

  async function refresh() {
    if (!cardId.value) {
      entries.value = []
      runningEntry.value = null
      stopTicking()
      return
    }

    entries.value = await $fetch<TimeEntry[]>(`/api/cards/${cardId.value}/time-entries`)
    // server state is authoritative; localStorage is only a resume hint for
    // which entry is running (covers a fresh tab that lost in-memory state).
    const serverRunning = entries.value.find(e => e.endedAt === null) ?? null

    if (serverRunning) {
      runningEntry.value = serverRunning
      persistRunning(cardId.value, serverRunning)
      startTicking()
    } else {
      runningEntry.value = null
      persistRunning(cardId.value, null)
      stopTicking()
    }
    now.value = Date.now()
  }

  watch(cardId, refresh, { immediate: true })
  onUnmounted(stopTicking)

  async function start() {
    if (!cardId.value || runningEntry.value) return
    const entry = await $fetch<TimeEntry>(`/api/cards/${cardId.value}/time-entries`, {
      method: 'POST',
      body: { source: 'timer' }
    })
    entries.value.unshift(entry)
    runningEntry.value = entry
    persistRunning(cardId.value, entry)
    now.value = Date.now()
    startTicking()
  }

  async function stop() {
    if (!cardId.value || !runningEntry.value) return
    const id = runningEntry.value.id
    const updated = await $fetch<TimeEntry>(`/api/time-entries/${id}`, { method: 'PATCH', body: { stop: true } })
    const index = entries.value.findIndex(e => e.id === id)
    if (index !== -1) entries.value[index] = updated
    runningEntry.value = null
    persistRunning(cardId.value, null)
    stopTicking()
  }

  async function addManual(input: { startedAt: string, durationMs: number, note?: string }) {
    if (!cardId.value) return
    const entry = await $fetch<TimeEntry>(`/api/cards/${cardId.value}/time-entries`, {
      method: 'POST',
      body: { source: 'manual', ...input }
    })
    entries.value.unshift(entry)
    entries.value.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
  }

  async function removeEntry(id: number) {
    await $fetch(`/api/time-entries/${id}`, { method: 'DELETE' })
    entries.value = entries.value.filter(e => e.id !== id)
    if (runningEntry.value?.id === id) {
      runningEntry.value = null
      stopTicking()
    }
  }

  return { entries, runningEntry, elapsedMs, totalMs, refresh, start, stop, addManual, removeEntry }
}
