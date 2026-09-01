<script setup lang="ts">
const src = ref<string | null>(null)
const scale = ref(1)
const translate = ref({ x: 0, y: 0 })
const dragging = ref(false)
const dragStart = { x: 0, y: 0 }
const translateStart = { x: 0, y: 0 }

function open(imageSrc: string) {
  src.value = imageSrc
  scale.value = 1
  translate.value = { x: 0, y: 0 }
}

function close() {
  src.value = null
}

function zoomBy(delta: number, center?: { x: number, y: number }) {
  const next = Math.min(6, Math.max(1, scale.value + delta))
  if (next === scale.value) return
  if (center && next > 1) {
    const ratio = next / scale.value - 1
    translate.value = {
      x: translate.value.x - center.x * ratio,
      y: translate.value.y - center.y * ratio
    }
  }
  scale.value = next
  if (scale.value === 1) translate.value = { x: 0, y: 0 }
}

function onWheel(event: WheelEvent) {
  event.preventDefault()
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const center = {
    x: event.clientX - rect.left - rect.width / 2,
    y: event.clientY - rect.top - rect.height / 2
  }
  zoomBy(event.deltaY > 0 ? -0.4 : 0.4, center)
}

function onDoubleClick(event: MouseEvent) {
  if (scale.value > 1) {
    scale.value = 1
    translate.value = { x: 0, y: 0 }
    return
  }
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  zoomBy(1.5, {
    x: event.clientX - rect.left - rect.width / 2,
    y: event.clientY - rect.top - rect.height / 2
  })
}

function onPointerDown(event: PointerEvent) {
  if (scale.value <= 1) return
  dragging.value = true
  dragStart.x = event.clientX
  dragStart.y = event.clientY
  translateStart.x = translate.value.x
  translateStart.y = translate.value.y
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
}

function onPointerMove(event: PointerEvent) {
  if (!dragging.value) return
  translate.value = {
    x: translateStart.x + (event.clientX - dragStart.x),
    y: translateStart.y + (event.clientY - dragStart.y)
  }
}

function onPointerUp() {
  dragging.value = false
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') close()
}

watch(src, (value) => {
  if (value) window.addEventListener('keydown', onKeydown)
  else window.removeEventListener('keydown', onKeydown)
})

onUnmounted(() => window.removeEventListener('keydown', onKeydown))

defineExpose({ open })
</script>

<template>
  <Teleport to="body">
    <div
      v-if="src"
      class="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center select-none"
      @wheel="onWheel"
      @click.self="close"
    >
      <div class="absolute top-3 right-3 flex items-center gap-1.5 z-10">
        <UButton
          icon="i-lucide-zoom-out"
          size="sm"
          color="neutral"
          variant="soft"
          @click="zoomBy(-0.6)"
        />
        <UButton
          icon="i-lucide-zoom-in"
          size="sm"
          color="neutral"
          variant="soft"
          @click="zoomBy(0.6)"
        />
        <UButton
          icon="i-lucide-x"
          size="sm"
          color="neutral"
          variant="soft"
          @click="close"
        />
      </div>

      <img
        :src="src"
        class="max-w-none transition-transform duration-100 ease-out"
        :class="scale > 1 ? (dragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-zoom-in'"
        :style="{
          transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
          maxHeight: '90vh',
          maxWidth: '90vw'
        }"
        draggable="false"
        @dblclick="onDoubleClick"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointerleave="onPointerUp"
      >
    </div>
  </Teleport>
</template>
