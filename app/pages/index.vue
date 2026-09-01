<script setup lang="ts">
const { boards, pending, refresh, deleteBoard } = useBoards()
await refresh()

const { confirm } = useConfirm()

async function handleDelete(board: { id: number, name: string }) {
  const ok = await confirm({
    title: `Excluir "${board.name}"?`,
    description: 'Todas as colunas e cards desse board serão apagados permanentemente.',
    confirmLabel: 'Excluir board'
  })
  if (ok) await deleteBoard(board.id)
}
</script>

<template>
  <div class="px-4 sm:px-8 py-6 sm:py-10">
    <div class="flex flex-wrap items-center justify-between gap-3 mb-1">
      <div>
        <h1 class="text-xl sm:text-2xl font-extrabold tracking-tight">
          Seus boards
        </h1>
        <p class="text-sm text-muted mt-1">
          {{ boards.length }} board{{ boards.length === 1 ? '' : 's' }} &middot; armazenado localmente
        </p>
      </div>
      <CreateBoardDialog @created="refresh" />
    </div>

    <div
      v-if="!pending && boards.length === 0"
      class="border border-dashed border-default rounded-2xl py-16 text-center text-muted mt-8"
    >
      Nenhum board ainda. Crie o primeiro para começar.
    </div>

    <div
      v-else
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-8"
    >
      <NuxtLink
        v-for="board in boards"
        :key="board.id"
        :to="`/boards/${board.id}`"
        class="group bg-default border border-default rounded-2xl p-5 flex flex-col gap-4 shadow-xs hover:border-primary/50 transition-colors"
      >
        <div class="flex items-start justify-between">
          <div class="w-9 h-9 rounded-[10px] bg-primary/10 flex items-center justify-center">
            <UIcon
              name="i-lucide-layout-dashboard"
              class="size-4.5 text-primary"
            />
          </div>
          <UButton
            icon="i-lucide-trash-2"
            size="xs"
            color="neutral"
            variant="ghost"
            class="opacity-0 group-hover:opacity-100"
            @click.stop.prevent="handleDelete(board)"
          />
        </div>
        <div>
          <p class="text-[16.5px] font-bold tracking-tight">
            {{ board.name }}
          </p>
          <p
            v-if="board.description"
            class="text-[12.5px] text-muted mt-1"
          >
            {{ board.description }}
          </p>
        </div>
        <div class="flex gap-3 text-xs text-muted border-t border-default pt-3.5">
          <span>{{ board.columnCount }} coluna{{ board.columnCount === 1 ? '' : 's' }}</span>
          <span>&middot;</span>
          <span>{{ board.cardCount }} card{{ board.cardCount === 1 ? '' : 's' }}</span>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>
