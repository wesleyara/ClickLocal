<script setup lang="ts">
import type { CardTag } from '~/composables/useCard'

const props = defineProps<{
  assignedTags: CardTag[]
  boardTags: CardTag[]
}>()
const emit = defineEmits<{
  add: [tag: CardTag]
  remove: [tagId: number]
  create: [input: { name: string, color: string }]
}>()

const PALETTE = ['#6d5ce8', '#2f9e8f', '#c17a1f', '#dc4c4c', '#3b82f6', '#16a34a']

const available = computed(() =>
  props.boardTags.filter(tag => !props.assignedTags.some(a => a.id === tag.id))
)

const picking = ref(false)
const creatingName = ref('')
const creatingColor = ref(PALETTE[0])

function createTag() {
  const name = creatingName.value.trim()
  if (!name) return
  emit('create', { name, color: creatingColor.value! })
  creatingName.value = ''
  picking.value = false
}
</script>

<template>
  <div class="flex flex-col gap-2.5">
    <span class="text-[11.5px] font-extrabold uppercase tracking-wide text-muted">Tags</span>

    <div class="flex items-center gap-1.5 flex-wrap">
      <span
        v-for="tag in assignedTags"
        :key="tag.id"
        class="inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-1 rounded-md"
        :style="{ background: `${tag.color}1a`, color: tag.color }"
      >
        {{ tag.name }}
        <UIcon
          name="i-lucide-x"
          class="size-2.5 cursor-pointer"
          @click="emit('remove', tag.id)"
        />
      </span>

      <UPopover v-model:open="picking">
        <button class="flex items-center gap-1 text-[11px] font-bold text-muted border border-dashed border-default rounded-md px-2 py-1">
          <UIcon
            name="i-lucide-plus"
            class="size-3"
          />
          Add
        </button>

        <template #content>
          <div class="p-3 w-[220px] flex flex-col gap-3">
            <div
              v-if="available.length"
              class="flex flex-col gap-1"
            >
              <button
                v-for="tag in available"
                :key="tag.id"
                class="flex items-center gap-2 text-[12.5px] px-2 py-1.5 rounded-md hover:bg-elevated text-left"
                @click="emit('add', tag); picking = false"
              >
                <span
                  class="size-2.5 rounded-full"
                  :style="{ background: tag.color }"
                />
                {{ tag.name }}
              </button>
            </div>

            <div class="border-t border-default pt-2.5 flex flex-col gap-2">
              <UInput
                v-model="creatingName"
                placeholder="Nova tag"
                size="sm"
                @keydown.enter="createTag"
              />
              <div class="flex items-center gap-1.5">
                <button
                  v-for="color in PALETTE"
                  :key="color"
                  class="size-5 rounded-full"
                  :style="{ background: color, outline: creatingColor === color ? `2px solid ${color}` : 'none', outlineOffset: '2px' }"
                  @click="creatingColor = color"
                />
              </div>
              <UButton
                label="Criar tag"
                size="xs"
                block
                :disabled="!creatingName.trim()"
                @click="createTag"
              />
            </div>
          </div>
        </template>
      </UPopover>
    </div>
  </div>
</template>
