<script setup lang="ts">
import type { CardChildSummary } from '~/composables/useCard'

defineProps<{ children: CardChildSummary[] }>()
const emit = defineEmits<{
  'add': [title: string]
  'open-fullscreen': [id: number]
}>()

const adding = ref(false)
const newTitle = ref('')

function submit() {
  const title = newTitle.value.trim()
  if (title) emit('add', title)
  newTitle.value = ''
  adding.value = false
}
</script>

<template>
  <div class="flex flex-col gap-2.5">
    <span class="text-[11.5px] font-extrabold uppercase tracking-wide text-muted">
      Subtasks &middot; {{ children.length }}
    </span>

    <div
      v-if="children.length"
      class="flex flex-col gap-1.5"
    >
      <button
        v-for="child in children"
        :key="child.id"
        class="w-full flex items-center gap-2.5 px-2.5 py-2 border border-default rounded-lg hover:bg-elevated text-left"
        @click="emit('open-fullscreen', child.id)"
      >
        <UIcon
          name="i-lucide-git-branch"
          class="size-3.5 text-muted shrink-0"
        />
        <span
          class="text-[13px] flex-1 truncate"
          :class="child.archived ? 'line-through text-muted' : ''"
        >{{ child.title }}</span>
        <span
          v-if="child.subtaskCount > 0"
          class="text-[11px] text-muted shrink-0"
        >{{ child.subtaskDoneCount }}/{{ child.subtaskCount }}</span>
        <UIcon
          name="i-lucide-chevron-right"
          class="size-3.5 text-muted shrink-0"
        />
      </button>
    </div>

    <UInput
      v-if="adding"
      v-model="newTitle"
      autofocus
      placeholder="Título da subtask"
      size="sm"
      @keydown.enter="submit"
      @keydown.esc="adding = false"
      @blur="submit"
    />
    <button
      v-else
      class="flex items-center gap-1.5 text-muted hover:text-default text-[12.5px] font-semibold self-start"
      @click="adding = true"
    >
      <UIcon
        name="i-lucide-plus"
        class="size-3.5"
      />
      Add subtask
    </button>
  </div>
</template>
