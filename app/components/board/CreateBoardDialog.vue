<script setup lang="ts">
const emit = defineEmits<{ created: [] }>()
const { createBoard } = useBoards()
const { templates, refresh: refreshTemplates, deleteTemplate } = useBoardTemplates()
const { confirm } = useConfirm()

const BLANK_TEMPLATE_ID = 'builtin:blank'

const open = ref(false)
const name = ref('')
const description = ref('')
const templateId = ref(BLANK_TEMPLATE_ID)
const saving = ref(false)

watch(open, async (isOpen) => {
  if (!isOpen) return
  templateId.value = BLANK_TEMPLATE_ID
  await refreshTemplates()
})

async function submit() {
  if (!name.value.trim()) return
  saving.value = true
  try {
    await createBoard({ name: name.value, description: description.value, templateId: templateId.value })
    name.value = ''
    description.value = ''
    open.value = false
    emit('created')
  } finally {
    saving.value = false
  }
}

async function removeTemplate(id: string, templateName: string) {
  const ok = await confirm({
    title: `Excluir o modelo "${templateName}"?`,
    description: 'Boards já criados a partir dele não são afetados.',
    confirmLabel: 'Excluir modelo'
  })
  if (!ok) return
  await deleteTemplate(id)
  if (templateId.value === id) templateId.value = BLANK_TEMPLATE_ID
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

        <div class="flex flex-col gap-1.5">
          <span class="text-[12px] font-semibold text-muted">Modelo</span>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
            <div
              v-for="template in templates"
              :key="template.id"
              role="button"
              tabindex="0"
              class="group relative text-left rounded-lg border p-2.5 cursor-pointer transition-colors"
              :class="templateId === template.id ? 'border-primary bg-primary/5' : 'border-default hover:bg-elevated'"
              @click="templateId = template.id"
              @keydown.enter.self="templateId = template.id"
            >
              <div class="flex items-center gap-1.5">
                <span class="text-[13px] font-semibold truncate">{{ template.name }}</span>
                <UIcon
                  v-if="!template.builtin"
                  name="i-lucide-user"
                  class="size-3 text-muted shrink-0"
                />
              </div>
              <div
                v-if="template.columns.length"
                class="flex gap-1 mt-2"
              >
                <span
                  v-for="(column, index) in template.columns"
                  :key="index"
                  class="h-1.5 flex-1 rounded-full"
                  :style="{ backgroundColor: column.color }"
                  :title="column.name"
                />
              </div>
              <p class="text-[11.5px] text-muted mt-1.5 truncate">
                {{ template.columns.length ? template.columns.map(c => c.name).join(' · ') : 'Sem colunas' }}
              </p>
              <UButton
                v-if="!template.builtin"
                icon="i-lucide-trash-2"
                color="neutral"
                variant="ghost"
                size="xs"
                aria-label="Excluir modelo"
                class="absolute top-1 right-1 opacity-0 group-hover:opacity-100 focus:opacity-100"
                @click.stop="removeTemplate(template.id, template.name)"
              />
            </div>
          </div>
        </div>
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
