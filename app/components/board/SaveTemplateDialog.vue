<script setup lang="ts">
const props = defineProps<{ boardId: number, defaultName?: string }>()

const { saveFromBoard } = useBoardTemplates()
const toast = useToast()

const open = ref(false)
const name = ref('')
const saving = ref(false)

watch(open, (isOpen) => {
  if (isOpen) name.value = props.defaultName ?? ''
})

async function submit() {
  if (!name.value.trim()) return
  saving.value = true
  try {
    await saveFromBoard(props.boardId, name.value)
    toast.add({ title: 'Modelo salvo', color: 'success' })
    open.value = false
  } catch {
    toast.add({ title: 'Falha ao salvar modelo', color: 'error' })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="Salvar como modelo"
    description="Copia as colunas (nome e cor) e as tags deste board. Os cards não são copiados."
  >
    <UButton
      icon="i-lucide-layout-template"
      color="neutral"
      variant="ghost"
      size="sm"
    >
      <span class="hidden sm:inline">Salvar como modelo</span>
    </UButton>

    <template #body>
      <UInput
        v-model="name"
        placeholder="Nome do modelo"
        autofocus
        class="w-full"
        @keydown.enter="submit"
      />
    </template>

    <template #footer>
      <div class="flex justify-end gap-2 w-full">
        <UButton
          label="Cancelar"
          color="neutral"
          variant="ghost"
          @click="open = false"
        />
        <UButton
          label="Salvar modelo"
          :loading="saving"
          :disabled="!name.trim()"
          @click="submit"
        />
      </div>
    </template>
  </UModal>
</template>
