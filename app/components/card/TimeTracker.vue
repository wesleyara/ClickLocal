<script setup lang="ts">
import type { CardAdoSummary } from '~/composables/useCard'

const props = defineProps<{ cardId: number | null, ado?: CardAdoSummary | null }>()
const emit = defineEmits<{ changed: [] }>()

const cardIdRef = toRef(props, 'cardId')
const { entries, runningEntry, elapsedMs, totalMs, start, stop, addManual, removeEntry } = useTimer(cardIdRef)

async function handleStop() {
  await stop()
  emit('changed')
}

function formatDuration(ms: number) {
  const totalSeconds = Math.floor(ms / 1000)
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0')
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0')
  const s = String(totalSeconds % 60).padStart(2, '0')
  return `${h}:${m}:${s}`
}

function formatTotal(ms: number) {
  const totalMinutes = Math.round(ms / 60000)
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  if (h === 0) return `${m}m`
  return `${h}h ${m}m`
}

const addingManual = ref(false)
const manualDate = ref('')
const manualHours = ref('')
const manualMinutes = ref('')
const manualNote = ref('')

function resetManualForm() {
  addingManual.value = false
  manualDate.value = ''
  manualHours.value = ''
  manualMinutes.value = ''
  manualNote.value = ''
}

async function submitManual() {
  const hours = Number(manualHours.value) || 0
  const minutes = Number(manualMinutes.value) || 0
  const durationMs = (hours * 60 + minutes) * 60_000

  if (!manualDate.value || durationMs <= 0) return

  await addManual({
    startedAt: new Date(manualDate.value).toISOString(),
    durationMs,
    note: manualNote.value
  })
  resetManualForm()
  emit('changed')
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <span class="text-[11.5px] font-extrabold uppercase tracking-wide text-muted">
      Time tracked &middot; {{ formatTotal(totalMs) }}
    </span>

    <p
      v-if="ado && !ado.supportsCompletedWork"
      class="flex items-center gap-1.5 text-[11.5px] text-muted bg-muted/60 rounded-lg px-2.5 py-2"
    >
      <UIcon
        name="i-lucide-info"
        class="size-3.5 shrink-0"
      />
      Este tipo não tem Completed Work; horas ficam só locais.
    </p>

    <div class="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <button
          class="size-9 rounded-[10px] flex items-center justify-center transition-colors"
          :class="runningEntry ? 'bg-error text-white hover:bg-error/90' : 'bg-primary text-white hover:bg-primary/90'"
          @click="runningEntry ? handleStop() : start()"
        >
          <UIcon
            :name="runningEntry ? 'i-lucide-square' : 'i-lucide-play'"
            class="size-4"
          />
        </button>
        <div>
          <p class="font-mono text-[17px] font-semibold leading-tight">
            {{ formatDuration(elapsedMs) }}
          </p>
          <p
            v-if="runningEntry"
            class="text-[11px] text-muted"
          >
            Running since {{ new Date(runningEntry.startedAt).toLocaleTimeString() }}
          </p>
        </div>
      </div>
    </div>

    <button
      v-if="!addingManual"
      class="flex items-center gap-1.5 text-[12px] font-bold text-primary self-start"
      @click="addingManual = true"
    >
      <UIcon
        name="i-lucide-plus"
        class="size-3"
      />
      Add time manually
    </button>

    <div
      v-else
      class="flex flex-col gap-2 border-t border-default pt-3"
    >
      <div class="flex gap-2">
        <UInput
          v-model="manualDate"
          type="datetime-local"
          size="sm"
          class="flex-1"
        />
      </div>
      <div class="flex gap-2">
        <UInput
          v-model="manualHours"
          type="number"
          min="0"
          placeholder="h"
          size="sm"
          class="w-20"
        />
        <UInput
          v-model="manualMinutes"
          type="number"
          min="0"
          max="59"
          placeholder="min"
          size="sm"
          class="w-20"
        />
        <UInput
          v-model="manualNote"
          placeholder="Nota (opcional)"
          size="sm"
          class="flex-1"
        />
      </div>
      <div class="flex justify-end gap-2">
        <UButton
          label="Cancelar"
          size="xs"
          color="neutral"
          variant="ghost"
          @click="resetManualForm"
        />
        <UButton
          label="Adicionar"
          size="xs"
          @click="submitManual"
        />
      </div>
    </div>

    <div
      v-if="entries.length"
      class="flex flex-col gap-2 border-t border-default pt-3"
    >
      <div
        v-for="entry in entries"
        :key="entry.id"
        class="group flex items-center justify-between text-[12.5px]"
      >
        <div class="flex items-center gap-2 text-default">
          <UIcon
            :name="entry.source === 'manual' ? 'i-lucide-pencil' : 'i-lucide-clock'"
            class="size-3 text-muted"
          />
          <span>{{ new Date(entry.startedAt).toLocaleString() }}</span>
          <span
            v-if="entry.note"
            class="text-muted"
          >&middot; {{ entry.note }}</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="font-semibold">{{ entry.durationMs !== null ? formatTotal(entry.durationMs) : '—' }}</span>
          <UIcon
            v-if="entry.adoPushedAt"
            name="i-lucide-lock"
            class="size-3 text-muted"
            title="Já enviado ao Azure DevOps"
          />
          <UButton
            v-else
            icon="i-lucide-x"
            size="xs"
            color="neutral"
            variant="ghost"
            class="opacity-0 group-hover:opacity-100"
            @click="removeEntry(entry.id)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
