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
const toast = useToast()

const editingBoardName = ref(false)
const boardNameDraft = ref('')

function startEditBoardName() {
  if (!store.board) return
  boardNameDraft.value = store.board.name
  editingBoardName.value = true
}

async function submitBoardName() {
  editingBoardName.value = false
  const name = boardNameDraft.value.trim()
  if (!name || name === store.board?.name) return
  await store.updateBoard({ name })
}

const { connection, refresh: refreshAdoConnection } = useAdoConnection()
await refreshAdoConnection()
const isAdoBoard = computed(() => connection.value?.boardId === boardId)
const syncing = ref(false)

async function handleSync() {
  syncing.value = true
  try {
    const result = await store.syncAdo()
    await refreshAdoConnection()
    toast.add({
      title: 'Sincronizado com o Azure DevOps',
      description: `${result.created} novo(s), ${result.updated} atualizado(s), ${result.moved} movido(s), ${result.archived} arquivado(s), ${result.unarchived} desarquivado(s)`,
      color: 'success'
    })
  } catch (error) {
    toast.add({ title: 'Falha ao sincronizar', description: (error as { data?: { statusMessage?: string } })?.data?.statusMessage, color: 'error' })
  } finally {
    syncing.value = false
  }
}

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

/** Only linked cards moving into a differently-mapped column need a heads-up before we touch ADO. */
async function confirmAdoMove(move: { cardId: number, fromColumnId: number, toColumnId: number }) {
  const card = store.columns.flatMap(c => c.cards).find(c => c.id === move.cardId)
  const targetColumn = store.columns.find(c => c.id === move.toColumnId)
  if (!card?.ado || !targetColumn?.adoStateCategory) return true
  if (card.ado.stateCategory === targetColumn.adoStateCategory) return true

  await refreshAdoConnection()
  const conn = connection.value
  const lines = [`#${card.ado.adoId} (${card.ado.project}): ${card.ado.state} → categoria "${targetColumn.adoStateCategory}"`]

  if (!conn || conn.writeMode === 'readonly') {
    lines.push('Conexão em modo Somente leitura: nada será enviado ao Azure DevOps e o card vai voltar.')
  } else if (!conn.writeAllowedProjects.includes(card.ado.project)) {
    lines.push(`Escrita não permitida no projeto "${card.ado.project}": o card vai voltar.`)
  } else if (conn.writeMode === 'dry-run') {
    lines.push('Modo Dry-run: nada será realmente enviado, apenas simulado.')
  }

  return confirm({
    title: `Mudar #${card.ado.adoId} no Azure DevOps?`,
    description: lines.join(' '),
    confirmLabel: 'Mover e atualizar'
  })
}

async function handleCardsChanged(move: { cardId: number, fromColumnId: number, toColumnId: number } | undefined) {
  if (move && !(await confirmAdoMove(move))) {
    await store.loadBoard(boardId)
    return
  }

  const result = await store.persistCardOrder()
  if (result?.failures.length) {
    toast.add({
      title: 'Falha ao atualizar o Azure DevOps',
      description: result.failures.map(f => f.reason).join(' — '),
      color: 'error'
    })
  }
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
  <div
    v-if="store.board"
    class="flex flex-col h-[calc(100dvh-var(--ui-header-height))]"
  >
    <div class="shrink-0 flex flex-col gap-3 px-4 sm:px-8 py-3 sm:py-4 border-b border-default">
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
        <UInput
          v-if="editingBoardName"
          v-model="boardNameDraft"
          autofocus
          size="sm"
          :ui="{ base: 'text-[15px] font-bold tracking-tight' }"
          class="min-w-0"
          @keydown.enter="submitBoardName"
          @keydown.esc="editingBoardName = false"
          @blur="submitBoardName"
        />
        <span
          v-else
          class="text-[15px] font-bold tracking-tight truncate cursor-text hover:opacity-80"
          @click="startEditBoardName"
        >{{ store.board.name }}</span>

        <div class="ms-auto flex items-center gap-2 shrink-0">
          <template v-if="isAdoBoard">
            <span
              v-if="connection?.lastSyncedAt"
              class="hidden sm:inline text-[11.5px] text-muted"
            >
              Última sync: {{ new Date(connection.lastSyncedAt).toLocaleString() }}
            </span>
            <UButton
              icon="i-lucide-refresh-cw"
              color="primary"
              variant="soft"
              size="sm"
              :loading="syncing"
              @click="handleSync"
            >
              <span class="hidden sm:inline">Sincronizar</span>
            </UButton>
            <PushHoursDialog @pushed="store.loadBoard(boardId)" />
          </template>
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
      class="flex-1 min-h-0 flex gap-4 px-4 sm:px-8 py-4 sm:py-6 items-start overflow-x-auto snap-x snap-proximity bg-muted/40"
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
        @cards-changed="handleCardsChanged"
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
