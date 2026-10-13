<script setup lang="ts">
import type { BoardCard } from '~/composables/useBoardStore'
import type { CardChildSummary } from '~/composables/useCard'

const props = defineProps<{ card: BoardCard }>()
const emit = defineEmits<{ delete: [id: number], open: [id: number] }>()

const expanded = ref(false)
const children = ref<CardChildSummary[] | null>(null)
const loadingChildren = ref(false)

async function toggleExpanded() {
  expanded.value = !expanded.value
  if (expanded.value && children.value === null) {
    loadingChildren.value = true
    try {
      const detail = await $fetch<{ children: CardChildSummary[] }>(`/api/cards/${props.card.id}`)
      children.value = detail.children
    } finally {
      loadingChildren.value = false
    }
  }
}

const now = ref(Date.now())
let tickInterval: ReturnType<typeof setInterval> | undefined

watchEffect(() => {
  if (!import.meta.client) return
  if (props.card.hasRunningTimer && props.card.runningTimerStartedAt) {
    if (!tickInterval) {
      now.value = Date.now()
      tickInterval = setInterval(() => {
        now.value = Date.now()
      }, 1000)
    }
  } else if (tickInterval) {
    clearInterval(tickInterval)
    tickInterval = undefined
  }
})
onUnmounted(() => clearInterval(tickInterval))

const runningElapsed = computed(() => {
  if (!props.card.runningTimerStartedAt) return null
  const totalSeconds = Math.max(0, Math.floor((now.value - new Date(props.card.runningTimerStartedAt).getTime()) / 1000))
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0')
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0')
  const s = String(totalSeconds % 60).padStart(2, '0')
  return `${h}:${m}:${s}`
})
</script>

<template>
  <div
    class="group bg-default border border-default rounded-[11px] p-3.5 flex flex-col gap-2.5 shadow-xs hover:border-primary/40 hover:shadow-md transition-all cursor-grab active:cursor-grabbing"
    @click="emit('open', card.id)"
  >
    <div
      v-if="card.ado"
      class="flex items-center gap-1.5 flex-wrap text-[11px] font-bold"
    >
      <span class="px-1.5 py-0.5 rounded-md bg-primary/10 text-primary">
        {{ card.ado.type }} #{{ card.ado.adoId }}
      </span>
      <span class="px-1.5 py-0.5 rounded-md bg-muted/60 text-muted">
        {{ card.ado.state }}
      </span>
      <span class="text-muted font-medium truncate">
        {{ card.ado.project }}
      </span>
    </div>
    <div class="flex items-start justify-between gap-2">
      <p class="text-[13.5px] font-semibold leading-snug">
        {{ card.title }}
      </p>
      <UButton
        v-if="!card.ado"
        icon="i-lucide-x"
        size="xs"
        color="neutral"
        variant="ghost"
        class="opacity-0 group-hover:opacity-100 shrink-0 -me-1 -mt-1"
        @click.stop="emit('delete', card.id)"
      />
    </div>
    <div
      v-if="card.tags.length"
      class="flex items-center gap-1.5 flex-wrap"
    >
      <span
        v-for="tag in card.tags"
        :key="tag.id"
        class="text-[11px] font-bold px-1.5 py-0.5 rounded-md"
        :style="{ background: `${tag.color}1a`, color: tag.color }"
      >
        {{ tag.name }}
      </span>
    </div>
    <div
      v-if="card.dueDate || card.subtaskCount > 0 || card.childCount > 0 || card.hasRunningTimer"
      class="flex items-center justify-between text-[11.5px] text-muted"
    >
      <span
        v-if="card.subtaskCount > 0"
        class="flex items-center gap-1"
      >
        <UIcon
          name="i-lucide-check-square"
          class="size-3"
        />
        {{ card.subtaskDoneCount }}/{{ card.subtaskCount }}
      </span>
      <button
        v-if="card.childCount > 0"
        class="flex items-center gap-1 hover:text-default"
        @click.stop="toggleExpanded"
      >
        <UIcon
          name="i-lucide-git-branch"
          class="size-3"
        />
        {{ card.childCount }}
        <UIcon
          :name="expanded ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
          class="size-3"
        />
      </button>
      <span
        v-if="card.hasRunningTimer"
        class="flex items-center gap-1 text-primary font-semibold font-mono"
      >
        <UIcon
          name="i-lucide-clock"
          class="size-3 animate-pulse"
        />
        {{ runningElapsed }}
      </span>
      <span
        v-if="card.dueDate"
        class="flex items-center gap-1.5"
      >
        <UIcon
          name="i-lucide-calendar"
          class="size-3"
        />
        {{ new Date(card.dueDate).toLocaleDateString() }}
      </span>
    </div>

    <div
      v-if="expanded"
      class="flex flex-col gap-1.5 -mx-1"
      @click.stop
    >
      <p
        v-if="loadingChildren"
        class="text-[11.5px] text-muted px-1"
      >
        Carregando...
      </p>
      <template v-else>
        <button
          v-for="child in children"
          :key="child.id"
          class="flex items-center gap-1.5 rounded-lg px-2 py-1.5 bg-muted/60 hover:bg-muted text-left cursor-pointer"
          @click.stop="emit('open', child.id)"
        >
          <UIcon
            name="i-lucide-git-branch"
            class="size-3 text-muted shrink-0"
          />
          <span
            class="text-[12px] flex-1 truncate"
            :class="child.archived ? 'line-through text-muted' : ''"
          >{{ child.title }}</span>
          <span
            v-if="child.subtaskCount > 0"
            class="text-[10.5px] text-muted shrink-0"
          >{{ child.subtaskDoneCount }}/{{ child.subtaskCount }}</span>
        </button>
      </template>
    </div>
  </div>
</template>
