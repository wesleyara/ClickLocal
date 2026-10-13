<script setup lang="ts">
const props = defineProps<{ code: string }>()

const colorMode = useColorMode()
const container = ref<HTMLElement | null>(null)
const failed = ref(false)
let counter = 0

async function render() {
  if (!container.value) return
  try {
    const { default: mermaid } = await import('mermaid')
    mermaid.initialize({
      startOnLoad: false,
      theme: colorMode.value === 'dark' ? 'dark' : 'neutral',
      securityLevel: 'strict'
    })
    const { svg } = await mermaid.render(`docs-mermaid-${counter++}-${Date.now()}`, props.code)
    container.value.innerHTML = svg
    failed.value = false
  } catch {
    failed.value = true
  }
}

onMounted(render)
watch(() => colorMode.value, render)
</script>

<template>
  <div class="my-4 flex justify-center overflow-x-auto rounded-xl border border-default p-4">
    <pre
      v-if="failed"
      class="text-sm"
    ><code>{{ code }}</code></pre>
    <div
      v-else
      ref="container"
    />
  </div>
</template>
