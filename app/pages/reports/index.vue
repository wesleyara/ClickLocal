<script setup lang="ts">
import { BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Tooltip } from 'chart.js'
import { Bar } from 'vue-chartjs'
import { PALETTE } from '~/utils/palette'

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend)

useSeoMeta({ title: 'Relatórios · ClickLocal' })

const { filters, byDay, table, tableGroupBy, pending, error, setPreset, refresh } = useTimeReport()
const { boards, refresh: refreshBoards } = useBoards()
const boardId = computed(() => filters.boardId)
const { tags } = useBoardTags(boardId)

await Promise.all([refreshBoards(), refresh()])

watch(() => filters.boardId, () => {
  filters.tagIds = []
})

const presets = [
  { label: 'Hoje', value: 'today' },
  { label: 'Semana', value: 'week' },
  { label: 'Mês', value: 'month' },
  { label: 'Personalizado', value: 'custom' }
] as const

const groupOptions = [
  { label: 'Board', value: 'board' },
  { label: 'Tag', value: 'tag' },
  { label: 'Card', value: 'card' }
]

const boardItems = computed(() => [
  { label: 'Todos os boards', value: 0 },
  ...boards.value.map(b => ({ label: b.name, value: b.id }))
])
const boardModel = computed({
  get: () => filters.boardId ?? 0,
  set: (value: number) => {
    filters.boardId = value || null
  }
})

const chartData = computed(() => {
  const days = daysBetween(filters.from, filters.to)
  const reportDays = new Map((byDay.value?.groups ?? []).map(g => [g.key, g]))
  const boardLabels = new Map<number, string>()
  for (const group of byDay.value?.groups ?? []) {
    for (const b of group.boards ?? []) boardLabels.set(b.id, b.label)
  }
  const datasets = [...boardLabels].map(([id, label], index) => ({
    label,
    backgroundColor: PALETTE[index % PALETTE.length],
    data: days.map(day => (reportDays.get(day)?.boards?.find(b => b.id === id)?.durationMs ?? 0) / 3_600_000)
  }))
  return { labels: days.map(d => d.slice(5).split('-').reverse().join('/')), datasets }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: { stacked: true },
    y: { stacked: true, beginAtZero: true, title: { display: true, text: 'Horas' } }
  },
  plugins: {
    tooltip: {
      callbacks: {
        label: (ctx: { dataset: { label?: string }, parsed: { y: number | null } }) =>
          `${ctx.dataset.label}: ${formatDuration((ctx.parsed.y ?? 0) * 3_600_000)}`
      }
    }
  }
}

const hasData = computed(() => (byDay.value?.entryCount ?? 0) > 0)
const tagOverlap = computed(() => tableGroupBy.value === 'tag' && table.value
  && table.value.groups.reduce((sum, g) => sum + g.durationMs, 0) > table.value.totalMs)
</script>

<template>
  <div class="px-4 sm:px-8 py-6 sm:py-10 max-w-6xl">
    <div class="mb-6">
      <h1 class="text-xl sm:text-2xl font-extrabold tracking-tight">
        Relatórios
      </h1>
      <p class="text-sm text-muted mt-1">
        Tempo registrado por período
      </p>
    </div>

    <div class="flex flex-wrap items-end gap-3 mb-6">
      <div class="flex gap-1">
        <UButton
          v-for="preset in presets"
          :key="preset.value"
          size="sm"
          color="neutral"
          :variant="filters.preset === preset.value ? 'solid' : 'outline'"
          @click="setPreset(preset.value)"
        >
          {{ preset.label }}
        </UButton>
      </div>
      <template v-if="filters.preset === 'custom'">
        <UInput
          v-model="filters.from"
          type="date"
          size="sm"
        />
        <UInput
          v-model="filters.to"
          type="date"
          size="sm"
        />
      </template>
      <USelect
        v-model="boardModel"
        :items="boardItems"
        size="sm"
        class="w-48"
      />
      <USelectMenu
        v-if="filters.boardId"
        v-model="filters.tagIds"
        :items="tags.map(t => ({ label: t.name, value: t.id }))"
        value-key="value"
        multiple
        placeholder="Tags"
        size="sm"
        class="w-48"
      />
    </div>

    <p
      v-if="error"
      class="text-sm text-error mb-4"
    >
      {{ error }}
    </p>

    <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
      <div class="border border-default rounded-2xl p-4">
        <p class="text-xs text-muted">
          Total
        </p>
        <p class="text-2xl font-extrabold tracking-tight">
          {{ formatDuration(byDay?.totalMs ?? 0) }}
        </p>
      </div>
      <div class="border border-default rounded-2xl p-4">
        <p class="text-xs text-muted">
          Registros
        </p>
        <p class="text-2xl font-extrabold tracking-tight">
          {{ byDay?.entryCount ?? 0 }}
        </p>
      </div>
    </div>

    <div class="border border-default rounded-2xl p-4 mb-8">
      <div
        v-if="!hasData && !pending"
        class="py-16 text-center text-muted text-sm"
      >
        Nenhum tempo registrado neste período.
      </div>
      <div
        v-else
        class="h-72"
      >
        <Bar
          :data="chartData"
          :options="chartOptions"
        />
      </div>
    </div>

    <div class="flex items-center justify-between mb-3">
      <h2 class="font-bold">
        Detalhamento
      </h2>
      <div class="flex gap-1">
        <UButton
          v-for="option in groupOptions"
          :key="option.value"
          size="xs"
          color="neutral"
          :variant="tableGroupBy === option.value ? 'solid' : 'outline'"
          @click="tableGroupBy = option.value as typeof tableGroupBy"
        >
          {{ option.label }}
        </UButton>
      </div>
    </div>

    <UAlert
      v-if="tagOverlap"
      color="warning"
      variant="subtle"
      icon="i-lucide-triangle-alert"
      class="mb-3"
      title="A soma por tag pode passar do total"
      description="Um card com várias tags tem seu tempo contado em cada uma delas."
    />

    <div class="border border-default rounded-2xl overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-elevated text-muted text-xs">
          <tr>
            <th class="text-left font-medium px-4 py-2">
              {{ groupOptions.find(o => o.value === tableGroupBy)?.label }}
            </th>
            <th class="text-right font-medium px-4 py-2">
              Registros
            </th>
            <th class="text-right font-medium px-4 py-2">
              Tempo
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="group in table?.groups ?? []"
            :key="group.key"
            class="border-t border-default"
          >
            <td class="px-4 py-2">
              <NuxtLink
                v-if="tableGroupBy === 'card' && group.boardId"
                :to="`/boards/${group.boardId}?card=${group.key}`"
                class="text-primary hover:underline"
              >
                {{ group.label }}
              </NuxtLink>
              <template v-else>
                {{ group.label }}
              </template>
            </td>
            <td class="px-4 py-2 text-right text-muted">
              {{ group.entryCount }}
            </td>
            <td class="px-4 py-2 text-right font-medium">
              {{ formatDuration(group.durationMs) }}
            </td>
          </tr>
          <tr v-if="!table?.groups.length">
            <td
              colspan="3"
              class="px-4 py-6 text-center text-muted"
            >
              Sem dados
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
