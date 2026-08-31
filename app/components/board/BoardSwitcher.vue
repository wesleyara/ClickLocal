<script setup lang="ts">
const router = useRouter()
const { boards, refresh } = useBoards()
const open = ref(false)

defineShortcuts({
  meta_k: () => { open.value = true }
})

watch(open, (value) => {
  if (value) refresh()
})

const groups = computed(() => [
  {
    id: 'boards',
    label: 'Boards',
    items: boards.value.map(board => ({
      label: board.name,
      suffix: `${board.cardCount} cards`,
      icon: 'i-lucide-layout-dashboard',
      onSelect: () => {
        open.value = false
        router.push(`/boards/${board.id}`)
      }
    }))
  }
])
</script>

<template>
  <UModal
    v-model:open="open"
    :ui="{ content: 'max-w-md' }"
  >
    <UButton
      icon="i-lucide-search"
      color="neutral"
      variant="outline"
      size="sm"
      class="text-muted"
      @click="open = true"
    >
      <span class="hidden sm:inline">Jump to board</span>
      <span class="hidden sm:flex items-center gap-1">
        <UKbd value="meta" />
        <UKbd value="K" />
      </span>
    </UButton>

    <template #content>
      <UCommandPalette
        :groups="groups"
        placeholder="Buscar board..."
        @update:open="open = $event"
      />
    </template>
  </UModal>
</template>
