<script setup lang="ts">
interface PendingHoursCard {
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

const emit = defineEmits<{ pushed: [] }>()

const { connection, refresh: refreshConnection } = useAdoConnection()
const toast = useToast()

const open = ref(false)
const pending = ref(false)
const sending = ref(false)
const cards = ref<PendingHoursCard[]>([])
const selected = ref<number[]>([])

function disabledReason(card: PendingHoursCard) {
  if (!connection.value || connection.value.writeMode === 'readonly') return 'Conexão em modo Somente leitura'
  if (!card.writeAllowed) return `Escrita não permitida no projeto "${card.project}"`
  if (!card.supportsCompletedWork) return `${card.type} não tem Completed Work`
  return null
}

async function refresh() {
  pending.value = true
  try {
    await refreshConnection()
    cards.value = await $fetch<PendingHoursCard[]>('/api/integrations/azure-devops/pending-hours')
    selected.value = cards.value.filter(c => !disabledReason(c)).map(c => c.cardId)
  } finally {
    pending.value = false
  }
}

watch(open, (value) => {
  if (value) refresh()
})

const modeLabel = computed(() => {
  switch (connection.value?.writeMode) {
    case 'write': return { label: 'Escrita: horas serão enviadas de verdade', color: 'error' as const }
    case 'dry-run': return { label: 'Dry-run: nada será realmente enviado, apenas simulado', color: 'warning' as const }
    default: return { label: 'Somente leitura: nenhuma hora será enviada', color: 'neutral' as const }
  }
})

async function submit() {
  if (selected.value.length === 0) return
  sending.value = true
  try {
    const { results } = await $fetch<{ results: { cardId: number, success: boolean, reason?: string }[] }>(
      '/api/integrations/azure-devops/push-hours',
      { method: 'POST', body: { cardIds: selected.value } }
    )
    const failures = results.filter(r => !r.success)
    if (failures.length > 0) {
      toast.add({ title: 'Algumas horas não foram enviadas', description: failures.map(f => f.reason).join(' — '), color: 'error' })
    } else {
      toast.add({ title: 'Horas enviadas', color: 'success' })
    }
    emit('pushed')
    await refresh()
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="Enviar horas"
    :ui="{ content: 'max-w-lg' }"
  >
    <UButton
      icon="i-lucide-clock-4"
      color="neutral"
      variant="ghost"
      size="sm"
      @click="open = true"
    >
      <span class="hidden sm:inline">Enviar horas</span>
    </UButton>

    <template #body>
      <div class="flex flex-col gap-3">
        <p
          class="text-[11.5px] font-bold rounded-lg px-2.5 py-2"
          :class="{
            'bg-error/10 text-error': modeLabel.color === 'error',
            'bg-warning/10 text-warning': modeLabel.color === 'warning',
            'bg-muted/60 text-muted': modeLabel.color === 'neutral'
          }"
        >
          {{ modeLabel.label }}
        </p>

        <div
          v-if="!pending && cards.length === 0"
          class="text-[12.5px] text-muted text-center py-6"
        >
          Nenhuma hora pendente de envio.
        </div>

        <div
          v-else
          class="flex flex-col gap-2 max-h-[50vh] overflow-y-auto"
        >
          <label
            v-for="card in cards"
            :key="card.cardId"
            class="flex items-start gap-2.5 border border-default rounded-lg px-3 py-2.5"
            :class="disabledReason(card) ? 'opacity-50' : ''"
          >
            <UCheckbox
              v-model="selected"
              :value="card.cardId"
              :disabled="!!disabledReason(card)"
              class="mt-0.5"
            />
            <div class="min-w-0 flex-1">
              <p class="text-[13px] font-semibold truncate">
                #{{ card.adoId }} {{ card.cardTitle }}
              </p>
              <p class="text-[11px] text-muted">
                {{ card.project }} &middot; {{ card.type }} &middot; {{ card.entryCount }} entrada(s)
              </p>
              <p class="text-[12px] font-mono mt-1">
                <template v-if="card.currentCompletedWorkKnown">
                  Completed Work: {{ card.currentCompletedWork }}h → <span class="font-bold">{{ Math.round((card.currentCompletedWork + card.pendingHours) * 100) / 100 }}h</span>
                  <span class="text-muted"> (+{{ card.pendingHours }}h)</span>
                </template>
                <template v-else>
                  <span class="text-muted">Valor atual indisponível</span> &middot; +{{ card.pendingHours }}h
                </template>
              </p>
              <p
                v-if="disabledReason(card)"
                class="text-[11px] text-error mt-1"
              >
                {{ disabledReason(card) }}
              </p>
            </div>
          </label>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2 w-full">
        <UButton
          label="Fechar"
          color="neutral"
          variant="ghost"
          @click="open = false"
        />
        <UButton
          label="Enviar horas selecionadas"
          :loading="sending"
          :disabled="selected.length === 0"
          @click="submit"
        />
      </div>
    </template>
  </UModal>
</template>
