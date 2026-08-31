<script setup lang="ts">
const emit = defineEmits<{ created: [] }>()
const { createBoard } = useBoards()

const open = ref(false)
const name = ref('')
const description = ref('')
const saving = ref(false)

async function submit() {
  if (!name.value.trim()) return
  saving.value = true
  try {
    await createBoard({ name: name.value, description: description.value })
    name.value = ''
    description.value = ''
    open.value = false
    emit('created')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="Novo board"
  >
    <UButton
      icon="i-lucide-plus"
      label="New board"
    />

    <template #body>
      <div class="flex flex-col gap-3">
        <UInput
          v-model="name"
          placeholder="Nome do board"
          autofocus
          @keydown.enter="submit"
        />
        <UTextarea
          v-model="description"
          placeholder="Descrição (opcional)"
          :rows="2"
        />
      </div>
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
          label="Criar board"
          :loading="saving"
          :disabled="!name.trim()"
          @click="submit"
        />
      </div>
    </template>
  </UModal>
</template>
