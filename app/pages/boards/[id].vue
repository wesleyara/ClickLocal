<script setup lang="ts">
import { VueDraggable } from 'vue-draggable-plus'
import type { BoardCard } from '~/composables/useBoardStore'

const route = useRoute()
const router = useRouter()
const boardId = Number(route.params.id)

const store = useBoardStore()
await store.loadBoard(boardId)

const boardIdRef = computed(() => boardId)
const { tags: boardTags } = useBoardTags(boardIdRef)
const { confirm } = useConfirm()

const openCardId = computed(() => {
  const raw = route.query.card
  return typeof raw === 'string' ? Number(raw) : null
})

function openCard(id: number) {
  router.push({ query: { ...route.query, card: id } })
}

function closeCard() {
  const { card: _card, ...rest } = route.query
  router.push({ query: rest })
  // subtasks/tags/description edited in the modal aren't reflected in the
  // board's card previews until refetched, so reload on close.
  store.loadBoard(boardId)
}

const addingColumn = ref(false)
const newColumnName = ref('')

async function submitNewColumn() {
  const name = newColumnName.value.trim()
  if (!name) {
    addingColumn.value = false
    return
  }
  await store.createColumn(name)
  newColumnName.value = ''
  addingColumn.value = false
}

async function handleDeleteCard(id: number) {
  const ok = await confirm({ title: 'Excluir este card?', confirmLabel: 'Excluir card' })
  if (ok) await store.deleteCard(id)
}

async function handleDeleteColumn(id: number) {
  const ok = await confirm({
    title: 'Excluir esta coluna?',
    description: 'Todos os cards dessa coluna serão apagados permanentemente.',
    confirmLabel: 'Excluir coluna'
  })
  if (ok) await store.deleteColumn(id)
}

// filters — client-side only, the underlying card arrays stay intact so
// drag-and-drop indices/positions are unaffected by hidden (filtered) cards
const searchQuery = ref('')
const activeTagIds = ref<number[]>([])

function toggleTagFilter(tagId: number) {
  activeTagIds.value = activeTagIds.value.includes(tagId)
    ? activeTagIds.value.filter(id => id !== tagId)
    : [...activeTagIds.value, tagId]
}

function matchesFilter(card: BoardCard) {
  const matchesSearch = card.title.toLowerCase().includes(searchQuery.value.trim().toLowerCase())
  const matchesTags = activeTagIds.value.length === 0 || card.tags.some(t => activeTagIds.value.includes(t.id))
  return matchesSearch && matchesTags
}

const searchInput = useTemplateRef('searchInput')
const columnRefs = useTemplateRef('columnRefs')

defineShortcuts({
  '/': () => searchInput.value?.inputRef?.focus(),
  'n': () => columnRefs.value?.[0]?.startAddingCard()
})
</script>

<template>
  <div v-if="store.board">
    <div class="flex flex-col gap-3 px-4 sm:px-8 py-3 sm:py-4 border-b border-default">
      <div class="flex items-center gap-3">
        <NuxtLink
          to="/"
          class="text-muted hover:text-default shrink-0"
        >
          <UIcon
            name="i-lucide-arrow-left"
            class="size-4"
          />
        </NuxtLink>
        <span class="text-[15px] font-bold tracking-tight truncate">{{ store.board.name }}</span>

        <div class="ms-auto flex items-center gap-2 shrink-0">
          <ArchivedCardsDialog
            :board-id="boardId"
            @restored="store.loadBoard(boardId)"
          />

          <UInput
            v-if="addingColumn"
            v-model="newColumnName"
            autofocus
            placeholder="Nome da coluna"
            size="sm"
            class="w-[140px] sm:w-[180px]"
            @keydown.enter="submitNewColumn"
            @keydown.esc="addingColumn = false"
            @blur="submitNewColumn"
          />
          <UButton
            v-else
            icon="i-lucide-plus"
            color="primary"
            variant="soft"
            size="sm"
            @click="addingColumn = true"
          >
            <span class="hidden sm:inline">Add column</span>
          </UButton>
        </div>
      </div>

      <div class="flex items-center gap-2 flex-wrap">
        <UInput
          ref="searchInput"
          v-model="searchQuery"
          icon="i-lucide-search"
          placeholder="Search cards... (/)"
          size="sm"
          class="w-full sm:w-64"
        />

        <div class="flex items-center gap-1.5 flex-wrap">
          <button
            v-for="tag in boardTags"
            :key="tag.id"
            class="text-[11px] font-bold px-2 py-1 rounded-md border transition-colors"
            :class="activeTagIds.includes(tag.id) ? '' : 'border-default text-muted'"
            :style="activeTagIds.includes(tag.id) ? { background: `${tag.color}1a`, color: tag.color, borderColor: tag.color } : undefined"
            @click="toggleTagFilter(tag.id)"
          >
            {{ tag.name }}
          </button>
        </div>
      </div>
    </div>

    <VueDraggable
      v-model="store.columns"
      :group="{ name: 'columns' }"
      handle=".drag-handle"
      class="flex gap-4 px-4 sm:px-8 py-4 sm:py-6 items-start overflow-x-auto snap-x snap-proximity bg-muted/40 min-h-[calc(100vh-65px)]"
      @end="store.persistColumnOrder()"
    >
      <BoardColumn
        v-for="column in store.columns"
        ref="columnRefs"
        :key="column.id"
        :column="column"
        :filter="matchesFilter"
        @delete-card="handleDeleteCard"
        @delete-column="handleDeleteColumn"
        @cards-changed="store.persistCardOrder()"
        @open-card="openCard"
      />
    </VueDraggable>

    <CardModal
      :card-id="openCardId"
      :board-id="boardId"
      @close="closeCard"
    />
  </div>
</template>
