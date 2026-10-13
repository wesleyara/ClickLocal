<script setup lang="ts">
interface RestoreResult {
  cards: number
  boards: number
  uploads: number
  missingUploads: number
  migrated: boolean
  preRestoreFile: string
}

const toast = useToast()
const { confirm } = useConfirm()

const fileInput = ref<HTMLInputElement | null>(null)
const restoring = ref(false)

function errorMessage(error: unknown) {
  return (error as { data?: { statusMessage?: string } })?.data?.statusMessage
}

async function handleFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  const confirmed = await confirm({
    title: 'Restaurar este backup?',
    description: `"${file.name}" vai substituir todos os boards, cards e anexos atuais. Antes disso, o ClickLocal guarda uma cópia dos dados atuais em data/backups.`,
    confirmLabel: 'Restaurar e sobrescrever'
  })
  if (!confirmed) return

  restoring.value = true
  try {
    // The raw file is the body, so the browser streams it instead of building a multipart form in memory.
    const result = await $fetch<RestoreResult>('/api/backup/import', {
      method: 'POST',
      body: file,
      headers: { 'Content-Type': 'application/zip' }
    })

    const missing = result.missingUploads ? ` ${result.missingUploads} anexo(s) estavam ausentes no backup.` : ''
    toast.add({
      title: 'Backup restaurado',
      description: `${result.boards} board(s), ${result.cards} card(s), ${result.uploads} arquivo(s). Cópia anterior: ${result.preRestoreFile}.${missing}`,
      color: 'success'
    })
    // The whole app state was replaced, so reload instead of patching stores one by one.
    setTimeout(() => reloadNuxtApp({ path: '/' }), 1500)
  } catch (error) {
    toast.add({ title: 'Falha ao restaurar', description: errorMessage(error), color: 'error' })
  } finally {
    restoring.value = false
  }
}
</script>

<template>
  <div class="px-4 sm:px-8 py-6 sm:py-10 max-w-2xl mx-auto flex flex-col gap-8">
    <div>
      <h1 class="text-xl sm:text-2xl font-extrabold tracking-tight">
        Backup e restauração
      </h1>
      <p class="text-sm text-muted mt-1">
        Baixe um .zip com o banco e os anexos, ou restaure a partir de um .zip gerado aqui. Veja os detalhes na
        <NuxtLink
          to="/docs/backup"
          class="text-primary underline"
        >documentação</NuxtLink>.
      </p>
    </div>

    <div class="bg-default border border-default rounded-2xl p-5 flex flex-col gap-4">
      <div>
        <h2 class="text-[15px] font-bold tracking-tight">
          Fazer backup
        </h2>
        <p class="text-[12.5px] text-muted mt-1">
          Gera um snapshot consistente do banco SQLite e de todos os anexos. O download começa em seguida.
        </p>
      </div>
      <div class="flex justify-end">
        <UButton
          label="Baixar backup"
          icon="i-lucide-download"
          external
          to="/api/backup/export"
          download
        />
      </div>
    </div>

    <div class="bg-default border border-default rounded-2xl p-5 flex flex-col gap-4">
      <div>
        <h2 class="text-[15px] font-bold tracking-tight">
          Restaurar backup
        </h2>
        <p class="text-[12.5px] text-muted mt-1">
          Envie um .zip de backup, de qualquer tamanho que caiba no disco. Ele é validado antes de qualquer mudança e <strong>sobrescreve os dados atuais</strong>.
        </p>
      </div>
      <input
        ref="fileInput"
        type="file"
        accept=".zip,application/zip"
        class="hidden"
        @change="handleFile"
      >
      <div class="flex justify-end">
        <UButton
          label="Escolher .zip e restaurar"
          icon="i-lucide-upload"
          color="error"
          variant="outline"
          :loading="restoring"
          @click="fileInput?.click()"
        />
      </div>
    </div>
  </div>
</template>
