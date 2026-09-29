<script setup lang="ts">
const props = defineProps<{ code: string, lang?: string }>()

const copied = ref(false)

async function copy() {
  try {
    await navigator.clipboard.writeText(props.code)
    copied.value = true
    setTimeout(() => (copied.value = false), 1500)
  } catch {
    copied.value = false
  }
}
</script>

<template>
  <div class="relative my-4 rounded-xl border border-default bg-elevated">
    <div class="flex items-center justify-between px-3 pt-2 text-xs text-muted">
      <span class="font-mono uppercase">{{ lang }}</span>
      <UButton
        :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'"
        color="neutral"
        variant="ghost"
        size="xs"
        :aria-label="copied ? 'Copiado' : 'Copiar'"
        @click="copy"
      >
        {{ copied ? 'Copiado' : 'Copiar' }}
      </UButton>
    </div>
    <pre class="overflow-x-auto px-4 pb-4 pt-1 text-sm leading-relaxed"><code>{{ code }}</code></pre>
  </div>
</template>
