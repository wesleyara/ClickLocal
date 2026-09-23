<script setup lang="ts">
import { VueDraggable } from 'vue-draggable-plus'
import type { BoardCard, BoardColumnWithCards } from '~/composables/useBoardStore'

const props = withDefaults(defineProps<{
  column: BoardColumnWithCards
  filter?: (card: BoardCard) => boolean
}>(), {
  filter: () => true
})
export interface CardMove {
  cardId: number
  fromColumnId: number
  toColumnId: number
}

const emit = defineEmits<{
  'delete-card': [id: number]
  'delete-column': [id: number]
  'cards-changed': [move: CardMove | undefined]
  'open-card': [id: number]
}>()

const store = useBoardStore()

// column is store state passed through as a prop; proxy through the store
// instead of writing to props.column directly so drag reorders stay a store mutation.
const storeColumn = computed(() => store.columns.find(c => c.id === props.column.id)!)
const cards = computed({
  get: () => storeColumn.value.cards,
  set: (value) => { storeColumn.value.cards = value }
})

// Only boards that already have ADO-synced cards or mapped columns show ADO options.
const isAdoBoard = computed(() => store.columns.some(c => c.adoStateCategory || c.cards.some(card => card.ado)))

const addingCard = ref(false)
const newCardTitle = ref('')

const PALETTE = ['#6d5ce8', '#2f9e8f', '#c17a1f', '#dc4c4c', '#3b82f6', '#16a34a']

const editing = ref(false)
const editName = ref('')
const editColor = ref('')
const editAdoStateCategory = ref<string | null>(null)

const ADO_STATE_CATEGORIES = [
  { label: 'Nenhum', value: null },
  { label: 'Proposed', value: 'Proposed' },
  { label: 'InProgress', value: 'InProgress' },
  { label: 'Resolved', value: 'Resolved' },
  { label: 'Completed', value: 'Completed' }
]

function openEdit() {
  editName.value = props.column.name
  editColor.value = props.column.color
  editAdoStateCategory.value = props.column.adoStateCategory
  editing.value = true
}

async function saveEdit() {
  const name = editName.value.trim()
  if (!name) return
  await store.updateColumn(props.column.id, { name, color: editColor.value, adoStateCategory: editAdoStateCategory.value })
  editing.value = false
}

async function submitNewCard() {
  const title = newCardTitle.value.trim()
  if (!title) {
    addingCard.value = false
    return
  }
  await store.createCard(props.column.id, title)
  newCardTitle.value = ''
  addingCard.value = false
}

function handleDragEnd(event: { item?: HTMLElement, from?: HTMLElement, to?: HTMLElement }) {
  const fromColumnId = Number(event.from?.dataset.columnId)
  const toColumnId = Number(event.to?.dataset.columnId)
  const cardId = Number(event.item?.dataset.cardId)

  const move = Number.isFinite(fromColumnId) && Number.isFinite(toColumnId) && Number.isFinite(cardId) && fromColumnId !== toColumnId
    ? { cardId, fromColumnId, toColumnId }
    : undefined

  emit('cards-changed', move)
}

defineExpose({
  startAddingCard: () => { addingCard.value = true }
})
</script>

<template>
  <div
    class="w-[85vw] max-w-[300px] sm:w-[272px] shrink-0 snap-start flex flex-col gap-3 border rounded-2xl p-2.5 shadow-xs h-full max-h-full overflow-hidden"
    :style="{ 'background': `${column.color}0f`, 'border-color': `${column.color}33`, '--column-color': column.color }"
  >
    <div class="drag-handle flex items-center justify-between px-1 pt-0.5 cursor-grab active:cursor-grabbing">
      <UPopover v-model:open="editing">
        <button
          class="flex items-center gap-1.5 min-w-0 rounded-md -ms-1 px-1 py-0.5 hover:bg-default/60"
          @click="openEdit"
        >
          <span
            class="size-1.5 rounded-full shrink-0"
            :style="{ background: column.color }"
          />
          <span class="text-[13px] font-bold truncate">{{ column.name }}</span>
          <span
            v-if="column.adoStateCategory"
            class="text-[10px] font-bold rounded-md px-1.5 py-0.5 shrink-0 bg-primary/10 text-primary flex items-center gap-1"
            :title="`Mapeada para ${column.adoStateCategory} no Azure DevOps`"
          >
            <UIcon
              name="i-lucide-plug-zap"
              class="size-2.5"
            />
            {{ column.adoStateCategory }}
          </span>
          <span
            class="text-[11px] font-bold rounded-md px-1.5 py-0.5 shrink-0"
            :style="{ color: column.color, background: `${column.color}1a` }"
          >{{ column.cards.length }}</span>
        </button>

        <template #content>
          <div class="p-3 w-[220px] flex flex-col gap-3">
            <UInput
              v-model="editName"
              autofocus
              placeholder="Nome da coluna"
              size="sm"
              @keydown.enter="saveEdit"
            />
            <div class="flex items-center gap-1.5">
              <button
                v-for="color in PALETTE"
                :key="color"
                class="size-5 rounded-full"
                :style="{ background: color, outline: editColor === color ? `2px solid ${color}` : 'none', outlineOffset: '2px' }"
                @click="editColor = color"
              />
            </div>
            <div v-if="isAdoBoard" class="flex flex-col gap-1">
              <label class="text-[11px] font-bold text-muted">Estado no ADO</label>
              <USelect
                v-model="editAdoStateCategory"
                :items="ADO_STATE_CATEGORIES"
                value-key="value"
                size="sm"
              />
            </div>
            <UButton
              label="Salvar"
              size="xs"
              block
              :disabled="!editName.trim()"
              @click="saveEdit"
            />
          </div>
        </template>
      </UPopover>
      <UButton
        icon="i-lucide-trash-2"
        size="xs"
        color="neutral"
        variant="ghost"
        @click="emit('delete-column', column.id)"
      />
    </div>

    <VueDraggable
      v-model="cards"
      :data-column-id="column.id"
      :group="{ name: 'cards', pull: true, put: true }"
      class="flex flex-col gap-2.5 min-h-[6px] flex-1 overflow-y-auto -me-1 pe-1"
      ghost-class="opacity-40"
      @end="handleDragEnd"
    >
      <BoardCard
        v-for="card in cards"
        :key="card.id"
        :data-card-id="card.id"
        :card="card"
        :class="{ hidden: !filter(card) }"
        @delete="emit('delete-card', $event)"
        @open="emit('open-card', $event)"
      />
    </VueDraggable>

    <UInput
      v-if="addingCard"
      v-model="newCardTitle"
      autofocus
      placeholder="Título do card"
      size="sm"
      @keydown.enter="submitNewCard"
      @keydown.esc="addingCard = false"
      @blur="submitNewCard"
    />
    <button
      v-else
      class="flex items-center gap-1.5 text-muted hover:text-[var(--column-color)] hover:bg-default/60 rounded-lg px-1 py-1.5 text-[12.5px] font-semibold transition-colors"
      @click="addingCard = true"
    >
      <UIcon
        name="i-lucide-plus"
        class="size-3.5"
      />
      Add card
    </button>
  </div>
</template>
