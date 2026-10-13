<script setup lang="ts">
const state = useConfirmState()

function resolve(value: boolean) {
  state.open = false
  state.resolve?.(value)
  state.resolve = null
}
</script>

<template>
  <UModal
    v-model:open="state.open"
    :title="state.title"
    :description="state.description"
    :ui="{ overlay: 'z-[60]', content: 'z-[60]' }"
    @update:open="(value) => { if (!value) resolve(false) }"
  >
    <template #footer>
      <div class="flex justify-end gap-2 w-full">
        <UButton
          label="Cancelar"
          color="neutral"
          variant="ghost"
          @click="resolve(false)"
        />
        <UButton
          :label="state.confirmLabel"
          :color="state.color"
          @click="resolve(true)"
        />
      </div>
    </template>
  </UModal>
</template>
