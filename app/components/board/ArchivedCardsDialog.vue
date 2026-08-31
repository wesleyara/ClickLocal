<script setup lang="ts">
interface ArchivedCard {
  id: number
  title: string
  updatedAt: string
  column: { name: string }
}

const props = defineProps<{ boardId: number }>()
const emit = defineEmits<{ restored: [] }>()

const open = ref(false)
const cards = ref<ArchivedCard[]>([])
const pending = ref(false)

async function refresh() {
  pending.value = true
  try {
    cards.value = await $fetch<ArchivedCard[]>(`/api/boards/${props.boardId}/archived-cards`)
  } finally {
    pending.value = false
  }
}

watch(open, (value) => {
  if (value) refresh()
})

async function restore(cardId: number) {
  await $fetch(`/api/cards/${cardId}`, { method: 'PATCH', body: { archived: false } })
  cards.value = cards.value.filter(c => c.id !== cardId)
  emit('restored')
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="Arquivados"
    :ui="{ content: 'max-w-md' }"
  >
    <UButton
      icon="i-lucide-archive"
      color="neutral"
      variant="ghost"
      size="sm"
      @click="open = true"
    >
      <span class="hidden sm:inline">Archived</span>
    </UButton>

    <template #body>
      <div
        v-if="!pending && cards.length === 0"
        class="text-[12.5px] text-muted text-center py-6"
      >
        Nenhum card arquivado.
      </div>
      <div
        v-else
        class="flex flex-col gap-2"
      >
        <div
          v-for="card in cards"
          :key="card.id"
          class="flex items-center justify-between gap-2 border border-default rounded-lg px-3 py-2"
        >
          <div class="min-w-0">
            <p class="text-[13px] font-semibold truncate">
              {{ card.title }}
            </p>
            <p class="text-[11px] text-muted">
              {{ card.column.name }} &middot; {{ new Date(card.updatedAt).toLocaleDateString() }}
            </p>
          </div>
          <UButton
            label="Restore"
            size="xs"
            color="neutral"
            variant="outline"
            class="shrink-0"
            @click="restore(card.id)"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
