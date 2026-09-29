<script setup lang="ts">
defineProps<{ type?: 'tip' | 'warning' | 'info', title?: string }>()

const icons = {
  tip: 'i-lucide-lightbulb',
  warning: 'i-lucide-triangle-alert',
  info: 'i-lucide-info'
} as const
const colors = { tip: 'success', warning: 'warning', info: 'info' } as const
</script>

<template>
  <UAlert
    class="my-4"
    variant="subtle"
    :color="colors[type ?? 'info']"
    :icon="icons[type ?? 'info']"
    :title="title"
  >
    <template #description>
      <slot />
    </template>
  </UAlert>
</template>
