<script setup lang="ts">
import type { CardChildSummary } from '~/composables/useCard'

defineProps<{ children: CardChildSummary[] }>()
const emit = defineEmits<{
  'add': [title: string]
  'open-fullscreen': [id: number]
}>()

const expandedId = ref<number | null>(null)

function toggle(id: number) {
  expandedId.value = expandedId.value === id ? null : id
}

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
      <div
        v-for="child in children"
        :key="child.id"
        class="border border-default rounded-lg overflow-hidden"
      >
        <button
          class="w-full flex items-center gap-2.5 px-2.5 py-2 hover:bg-elevated text-left"
          @click="toggle(child.id)"
        >
          <UIcon
            name="i-lucide-git-branch"
            class="size-3.5 text-muted shrink-0"
          />
          <span class="text-[13px] flex-1 truncate">{{ child.title }}</span>
          <span
            v-if="child.subtaskCount > 0"
            class="text-[11px] text-muted shrink-0"
          >{{ child.subtaskDoneCount }}/{{ child.subtaskCount }}</span>
          <UIcon
            :name="expandedId === child.id ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
            class="size-3.5 text-muted shrink-0"
          />
        </button>

        <div
          v-if="expandedId === child.id"
          class="border-t border-default px-2.5 py-3 flex flex-col gap-2.5 bg-elevated/40"
        >
          <p
            v-if="child.description"
            class="text-[12.5px] text-muted line-clamp-3 whitespace-pre-wrap"
          >
            {{ child.description }}
          </p>

          <div
            v-if="child.tags.length"
            class="flex items-center gap-1.5 flex-wrap"
          >
            <span
              v-for="tag in child.tags"
              :key="tag.id"
              class="text-[10.5px] font-bold px-1.5 py-0.5 rounded-md"
              :style="{ background: `${tag.color}1a`, color: tag.color }"
            >
              {{ tag.name }}
            </span>
          </div>

          <div
            v-if="child.subtaskCount > 0"
            class="h-1 rounded bg-default overflow-hidden"
          >
            <div
              class="h-full bg-primary transition-all"
              :style="{ width: `${Math.round((child.subtaskDoneCount / child.subtaskCount) * 100)}%` }"
            />
          </div>

          <div class="flex items-center justify-between text-[11px] text-muted">
            <div class="flex items-center gap-3">
              <span
                v-if="child.dueDate"
                class="flex items-center gap-1"
              >
                <UIcon
                  name="i-lucide-calendar"
                  class="size-3"
                />
                {{ new Date(child.dueDate).toLocaleDateString() }}
              </span>
              <span
                v-if="child.childCount > 0"
                class="flex items-center gap-1"
              >
                <UIcon
                  name="i-lucide-git-branch"
                  class="size-3"
                />
                {{ child.childCount }} subtask{{ child.childCount === 1 ? '' : 's' }}
              </span>
            </div>
            <UButton
              label="Abrir em tela cheia"
              icon="i-lucide-maximize-2"
              size="xs"
              color="neutral"
              variant="ghost"
              @click="emit('open-fullscreen', child.id)"
            />
          </div>
        </div>
      </div>
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
