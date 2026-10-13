<script setup lang="ts">
interface Orphan {
  id: number
  fileName: string
  mimeType: string
  size: number
  createdAt: string
  url: string
  card: { id: number, title: string }
  board: { id: number, name: string }
}

const toast = useToast()
const { confirm } = useConfirm()

const { data: orphans, pending, refresh } = await useFetch<Orphan[]>('/api/attachments/orphans', { default: () => [] })

const selected = ref<Set<number>>(new Set())
const deleting = ref(false)

const allSelected = computed(() => orphans.value.length > 0 && selected.value.size === orphans.value.length)
const totalSize = computed(() => orphans.value.reduce((sum, a) => sum + a.size, 0))
const selectedSize = computed(() => orphans.value.filter(a => selected.value.has(a.id)).reduce((sum, a) => sum + a.size, 0))

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function toggle(id: number) {
  const next = new Set(selected.value)
  if (!next.delete(id)) next.add(id)
  selected.value = next
}

function toggleAll() {
  selected.value = allSelected.value ? new Set() : new Set(orphans.value.map(a => a.id))
}

async function handleDelete() {
  const count = selected.value.size
  if (!count) return

  const confirmed = await confirm({
    title: `Excluir ${count} anexo(s) definitivamente?`,
    description: `Libera ${formatSize(selectedSize.value)}. Os arquivos são apagados do disco e não podem ser recuperados, a não ser por um backup.`,
    confirmLabel: 'Excluir definitivamente'
  })
  if (!confirmed) return

  deleting.value = true
  try {
    const result = await $fetch<{ deleted: number, skipped: number, freedBytes: number }>('/api/attachments/orphans', {
      method: 'DELETE',
      body: { ids: [...selected.value] }
    })
    selected.value = new Set()
    await refresh()
    toast.add({
      title: `${result.deleted} anexo(s) excluído(s)`,
      description: `${formatSize(result.freedBytes)} liberados.${result.skipped ? ` ${result.skipped} ignorado(s) por já estarem em uso.` : ''}`,
      color: 'success'
    })
  } catch (error) {
    toast.add({ title: 'Falha ao excluir', description: (error as { data?: { statusMessage?: string } })?.data?.statusMessage, color: 'error' })
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div class="px-4 sm:px-8 py-6 sm:py-10 max-w-3xl mx-auto flex flex-col gap-6">
    <div>
      <h1 class="text-xl sm:text-2xl font-extrabold tracking-tight">
        Anexos órfãos
      </h1>
      <p class="text-sm text-muted mt-1">
        Anexos de todos os boards que não aparecem mais na descrição nem nos comentários de nenhum card, por exemplo uma imagem
        removida do texto. Anexos enviados nas últimas 24h não são listados. Veja os detalhes na
        <NuxtLink
          to="/docs/backup#anexos-orfaos"
          class="text-primary underline"
        >documentação</NuxtLink>.
      </p>
    </div>

    <div
      v-if="!pending && !orphans.length"
      class="bg-default border border-default rounded-2xl p-8 text-center text-sm text-muted"
    >
      Nenhum anexo órfão. Tudo que está no disco está em uso.
    </div>

    <div
      v-else-if="orphans.length"
      class="bg-default border border-default rounded-2xl overflow-hidden"
    >
      <div class="flex items-center justify-between gap-3 px-4 py-3 border-b border-default">
        <label class="flex items-center gap-2 text-[13px] font-bold cursor-pointer">
          <UCheckbox
            :model-value="allSelected"
            @update:model-value="toggleAll"
          />
          Selecionar todos
        </label>
        <div class="flex items-center gap-3">
          <span class="text-[12.5px] text-muted">
            {{ orphans.length }} anexo(s) &middot; {{ formatSize(totalSize) }}
          </span>
          <UButton
            :label="selected.size ? `Excluir ${selected.size} (${formatSize(selectedSize)})` : 'Excluir selecionados'"
            icon="i-lucide-trash-2"
            color="error"
            :disabled="!selected.size"
            :loading="deleting"
            @click="handleDelete"
          />
        </div>
      </div>

      <ul class="divide-y divide-default">
        <li
          v-for="attachment in orphans"
          :key="attachment.id"
          class="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-elevated/50"
          @click="toggle(attachment.id)"
        >
          <UCheckbox
            :model-value="selected.has(attachment.id)"
            @click.stop
            @update:model-value="toggle(attachment.id)"
          />
          <div class="size-14 shrink-0 rounded-lg bg-elevated overflow-hidden flex items-center justify-center">
            <img
              v-if="attachment.mimeType.startsWith('image/')"
              :src="attachment.url"
              :alt="attachment.fileName"
              loading="lazy"
              class="size-full object-cover"
            >
            <UIcon
              v-else
              name="i-lucide-video"
              class="size-6 text-muted"
            />
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-[13.5px] font-bold truncate">
              {{ attachment.fileName }}
            </p>
            <p class="text-[12px] text-muted truncate">
              {{ attachment.board.name }} &rsaquo; {{ attachment.card.title }}
            </p>
            <p class="text-[12px] text-muted">
              {{ formatSize(attachment.size) }} &middot; {{ new Date(attachment.createdAt).toLocaleDateString() }}
            </p>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>
