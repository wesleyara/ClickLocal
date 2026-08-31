<script setup lang="ts">
import type { BoardCard } from '~/composables/useBoardStore'

defineProps<{ card: BoardCard }>()
const emit = defineEmits<{ delete: [id: number], open: [id: number] }>()
</script>

<template>
  <div
    class="group bg-default border border-default rounded-[11px] p-3.5 flex flex-col gap-2.5 shadow-xs hover:border-primary/40 hover:shadow-md transition-all cursor-grab active:cursor-grabbing"
    @click="emit('open', card.id)"
  >
    <div class="flex items-start justify-between gap-2">
      <p class="text-[13.5px] font-semibold leading-snug">
        {{ card.title }}
      </p>
      <UButton
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
      <span
        v-if="card.childCount > 0"
        class="flex items-center gap-1"
      >
        <UIcon
          name="i-lucide-git-branch"
          class="size-3"
        />
        {{ card.childCount }}
      </span>
      <span
        v-if="card.hasRunningTimer"
        class="flex items-center gap-1 text-primary font-semibold"
      >
        <UIcon
          name="i-lucide-clock"
          class="size-3"
        />
        running
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
  </div>
</template>
