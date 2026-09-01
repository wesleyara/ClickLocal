<script setup lang="ts">
import type { CardSubtask } from '~/composables/useCard'

const props = defineProps<{ subtasks: CardSubtask[] }>()
const emit = defineEmits<{
  toggle: [id: number, completed: boolean]
  remove: [id: number]
  add: [title: string]
  rename: [id: number, title: string]
}>()

const doneCount = computed(() => props.subtasks.filter(s => s.completed).length)
const progress = computed(() => props.subtasks.length ? Math.round((doneCount.value / props.subtasks.length) * 100) : 0)

const adding = ref(false)
const newTitle = ref('')

function submit() {
  const title = newTitle.value.trim()
  if (title) emit('add', title)
  newTitle.value = ''
  adding.value = false
}

const editingId = ref<number | null>(null)
const editTitle = ref('')

function startEdit(subtask: CardSubtask) {
  editingId.value = subtask.id
  editTitle.value = subtask.title
}

function submitEdit() {
  if (editingId.value === null) return
  const title = editTitle.value.trim()
  if (title) emit('rename', editingId.value, title)
  editingId.value = null
}
</script>

<template>
  <div class="flex flex-col gap-2.5">
    <div class="flex items-center justify-between">
      <span class="text-[11.5px] font-extrabold uppercase tracking-wide text-muted">
        Checklist &middot; {{ doneCount }}/{{ subtasks.length }}
      </span>
    </div>

    <div
      v-if="subtasks.length"
      class="h-1.5 rounded bg-elevated overflow-hidden"
    >
      <div
        class="h-full bg-primary transition-all"
        :style="{ width: `${progress}%` }"
      />
    </div>

    <div class="flex flex-col gap-2">
      <div
        v-for="subtask in subtasks"
        :key="subtask.id"
        class="group flex items-center gap-2.5"
      >
        <UCheckbox
          :model-value="subtask.completed"
          @update:model-value="emit('toggle', subtask.id, !!$event)"
        />
        <UInput
          v-if="editingId === subtask.id"
          v-model="editTitle"
          autofocus
          size="sm"
          class="flex-1"
          @keydown.enter="submitEdit"
          @keydown.esc="editingId = null"
          @blur="submitEdit"
        />
        <span
          v-else
          class="text-[13px] flex-1 cursor-text"
          :class="subtask.completed ? 'line-through text-muted' : ''"
          @click="startEdit(subtask)"
        >{{ subtask.title }}</span>
        <UButton
          icon="i-lucide-x"
          size="xs"
          color="neutral"
          variant="ghost"
          class="opacity-0 group-hover:opacity-100"
          @click="emit('remove', subtask.id)"
        />
      </div>
    </div>

    <UInput
      v-if="adding"
      v-model="newTitle"
      autofocus
      placeholder="Item do checklist"
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
      Add item
    </button>
  </div>
</template>
