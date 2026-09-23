<script setup lang="ts">
import { MdEditor, MdPreview } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import * as md from '~/utils/markdownToolbar'
import type { InsertGenerator } from '~/utils/markdownToolbar'

const props = withDefaults(defineProps<{
  modelValue: string
  height?: string
  onUploadImg?: (files: File[], callback: (urls: string[]) => void) => void
}>(), {
  height: '240px'
})

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const viewMode = ref<'editor' | 'preview'>('editor')
const editorRef = useTemplateRef('editorRef')

function run(generator: InsertGenerator) {
  editorRef.value?.insert(generator)
}

const headingItems = [1, 2, 3, 4, 5, 6].map(level => ({
  label: `Heading ${level}`,
  icon: `i-lucide-heading-${level}`,
  onSelect: () => run(md.heading(level as 1 | 2 | 3 | 4 | 5 | 6))
})).concat([
  { label: 'Subscript', icon: 'i-lucide-subscript', onSelect: () => run(md.sub) },
  { label: 'Superscript', icon: 'i-lucide-superscript', onSelect: () => run(md.sup) }
])

const insertItems = [
  { label: 'Quote', icon: 'i-lucide-quote', onSelect: () => run(md.quote) },
  { label: 'Inline code', icon: 'i-lucide-code', onSelect: () => run(md.codeInline) },
  { label: 'Code block', icon: 'i-lucide-square-code', onSelect: () => run(md.codeBlock) },
  { label: 'Link', icon: 'i-lucide-link', onSelect: () => run(md.link) },
  { label: 'Image', icon: 'i-lucide-image', onSelect: () => run(md.image) },
  { label: 'Table', icon: 'i-lucide-table', onSelect: () => run(md.table) },
  { label: 'Diagram', icon: 'i-lucide-workflow', onSelect: () => run(md.mermaid) },
  { label: 'Formula', icon: 'i-lucide-sigma', onSelect: () => run(md.katex) }
]
</script>

<template>
  <div class="flex flex-col">
    <div class="flex items-center justify-between gap-2 rounded-t-md border border-default bg-elevated/50 px-1.5 py-1">
      <div
        v-if="viewMode === 'editor'"
        class="flex flex-wrap items-center gap-0.5"
      >
        <UButton
          icon="i-lucide-bold"
          size="xs"
          color="neutral"
          variant="ghost"
          @click="run(md.bold)"
        />
        <UButton
          icon="i-lucide-italic"
          size="xs"
          color="neutral"
          variant="ghost"
          @click="run(md.italic)"
        />
        <UButton
          icon="i-lucide-underline"
          size="xs"
          color="neutral"
          variant="ghost"
          @click="run(md.underline)"
        />
        <UButton
          icon="i-lucide-strikethrough"
          size="xs"
          color="neutral"
          variant="ghost"
          @click="run(md.strikeThrough)"
        />

        <div class="w-px h-4 bg-default mx-0.5" />

        <UDropdownMenu :items="headingItems">
          <UButton
            icon="i-lucide-heading"
            trailing-icon="i-lucide-chevron-down"
            size="xs"
            color="neutral"
            variant="ghost"
          />
        </UDropdownMenu>

        <div class="w-px h-4 bg-default mx-0.5" />

        <UButton
          icon="i-lucide-list"
          size="xs"
          color="neutral"
          variant="ghost"
          @click="run(md.unorderedList)"
        />
        <UButton
          icon="i-lucide-list-ordered"
          size="xs"
          color="neutral"
          variant="ghost"
          @click="run(md.orderedList)"
        />
        <UButton
          icon="i-lucide-list-todo"
          size="xs"
          color="neutral"
          variant="ghost"
          @click="run(md.task)"
        />

        <div class="w-px h-4 bg-default mx-0.5" />

        <UDropdownMenu :items="insertItems">
          <UButton
            icon="i-lucide-plus"
            trailing-icon="i-lucide-chevron-down"
            label="Insert"
            size="xs"
            color="neutral"
            variant="ghost"
          />
        </UDropdownMenu>
      </div>
      <span
        v-else
        class="text-[11px] font-bold uppercase tracking-wide text-muted px-1"
      >Preview</span>

      <div class="flex items-center gap-0.5 shrink-0">
        <UButton
          label="Editor"
          size="xs"
          color="neutral"
          :variant="viewMode === 'editor' ? 'solid' : 'ghost'"
          @click="viewMode = 'editor'"
        />
        <UButton
          label="Preview"
          size="xs"
          color="neutral"
          :variant="viewMode === 'preview' ? 'solid' : 'ghost'"
          @click="viewMode = 'preview'"
        />
      </div>
    </div>

    <ClientOnly>
      <MdEditor
        v-if="viewMode === 'editor'"
        ref="editorRef"
        :model-value="props.modelValue"
        language="en-US"
        preview-theme="default"
        :preview="false"
        :toolbars="[]"
        :show-code-row-number="true"
        :style="{ height: props.height }"
        class="!rounded-t-none"
        :on-upload-img="props.onUploadImg"
        :no-img-zoom-in="true"
        @update:model-value="emit('update:modelValue', $event)"
      />
      <MdPreview
        v-else
        :model-value="props.modelValue"
        language="en-US"
        preview-theme="default"
        :no-img-zoom-in="true"
        :show-code-row-number="true"
        class="border border-default border-t-0 rounded-b-md px-3 py-2 overflow-y-auto"
        :style="{ height: props.height }"
      />
    </ClientOnly>
  </div>
</template>
