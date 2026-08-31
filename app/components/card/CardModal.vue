<script setup lang="ts">
import { MdEditor, MdPreview } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'

const props = defineProps<{ cardId: number | null, boardId: number }>()
const emit = defineEmits<{ close: [] }>()

const boardIdRef = toRef(props, 'boardId')
const isMobile = useIsMobile()

// local stack of card ids for pushing into a subtask card's own detail without
// touching the route — the root entry mirrors props.cardId, deeper entries are
// pure client-side navigation ("substitui o conteúdo" style, no nested modals)
const stack = ref<number[]>([])
watch(() => props.cardId, (id) => {
  stack.value = id !== null ? [id] : []
}, { immediate: true })

const activeCardId = computed(() => stack.value.length ? stack.value[stack.value.length - 1]! : null)

function goBack() {
  stack.value.pop()
}
function openChildFullscreen(id: number) {
  stack.value.push(id)
  fullscreen.value = true
}

const {
  card,
  saveDescription,
  addComment,
  removeComment,
  addSubtask,
  toggleSubtask,
  removeSubtask,
  addTag,
  removeTag,
  setArchived,
  addChildCard
} = useCard(activeCardId)
const { tags: boardTags, createTag } = useBoardTags(boardIdRef)
const { entries: activityEntries, refresh: refreshActivity } = useActivity(activeCardId)

async function handleToggleArchive() {
  if (!card.value) return
  await setArchived(!card.value.archived)
  await refreshActivity()
  if (card.value.archived) emit('close')
}

const open = computed({
  get: () => props.cardId !== null,
  set: (value) => { if (!value) emit('close') }
})

const fullscreen = ref(false)
watch(() => props.cardId, () => {
  fullscreen.value = false
})

async function handleAddChildCard(title: string) {
  await addChildCard(title)
  await refreshActivity()
}

const descriptionDraft = ref('')
const savingDescription = ref(false)
let descriptionTimer: ReturnType<typeof setTimeout> | undefined

watch(() => card.value?.id, () => {
  descriptionDraft.value = card.value?.description ?? ''
})

function onDescriptionChange(value: string) {
  descriptionDraft.value = value
  savingDescription.value = true
  clearTimeout(descriptionTimer)
  descriptionTimer = setTimeout(async () => {
    await saveDescription(value)
    savingDescription.value = false
  }, 600)
}

async function handleAddTag(tag: Parameters<typeof addTag>[0]) {
  await addTag(tag)
  await refreshActivity()
}

async function handleRemoveTag(tagId: number) {
  await removeTag(tagId)
  await refreshActivity()
}

async function handleCreateTag(input: { name: string, color: string }) {
  const tag = await createTag(input)
  if (tag) await handleAddTag(tag)
}

async function handleAddSubtask(title: string) {
  await addSubtask(title)
  await refreshActivity()
}

async function handleToggleSubtask(id: number, completed: boolean) {
  await toggleSubtask(id, completed)
  await refreshActivity()
}

async function handleRemoveSubtask(id: number) {
  await removeSubtask(id)
  await refreshActivity()
}

const newComment = ref('')
const postingComment = ref(false)

async function submitComment() {
  if (!newComment.value.trim()) return
  postingComment.value = true
  try {
    await addComment(newComment.value)
    newComment.value = ''
    await refreshActivity()
  } finally {
    postingComment.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="open"
    :fullscreen="fullscreen"
    :ui="{ content: fullscreen ? '' : 'sm:max-w-3xl' }"
  >
    <template #content="{ close }">
      <div
        v-if="card"
        class="flex flex-col flex-1 min-h-0"
      >
        <div class="px-4 sm:px-6 py-4 sm:py-5 border-b border-default flex items-start justify-between gap-3">
          <div class="min-w-0">
            <button
              v-if="stack.length > 1"
              class="flex items-center gap-1 text-[12px] font-bold text-muted hover:text-default mb-1.5"
              @click="goBack"
            >
              <UIcon
                name="i-lucide-chevron-left"
                class="size-3.5"
              />
              Back
            </button>
            <p class="text-[17px] sm:text-[19px] font-extrabold tracking-tight leading-snug">
              {{ card.title }}
            </p>
            <span
              v-if="card.archived"
              class="inline-flex items-center gap-1 text-[11px] font-bold text-muted mt-1.5"
            >
              <UIcon
                name="i-lucide-archive"
                class="size-3"
              />
              Archived
            </span>
          </div>
          <div class="flex items-center gap-1 shrink-0">
            <UButton
              :icon="card.archived ? 'i-lucide-archive-restore' : 'i-lucide-archive'"
              size="xs"
              color="neutral"
              variant="ghost"
              @click="handleToggleArchive"
            >
              <span class="hidden sm:inline">{{ card.archived ? 'Unarchive' : 'Archive' }}</span>
            </UButton>
            <UButton
              :icon="fullscreen ? 'i-lucide-minimize-2' : 'i-lucide-maximize-2'"
              size="xs"
              color="neutral"
              variant="ghost"
              @click="fullscreen = !fullscreen"
            />
            <UButton
              icon="i-lucide-x"
              size="xs"
              color="neutral"
              variant="ghost"
              @click="close"
            />
          </div>
        </div>

        <div class="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5 flex flex-col gap-7">
          <div class="flex flex-col gap-2">
            <div class="flex items-center justify-between">
              <span class="text-[11.5px] font-extrabold uppercase tracking-wide text-muted">Description</span>
              <span
                v-if="savingDescription"
                class="text-[11px] text-muted"
              >Salvando...</span>
            </div>
            <ClientOnly>
              <MdEditor
                :model-value="descriptionDraft"
                language="en-US"
                preview-theme="default"
                :preview="!isMobile"
                :toolbars-exclude="['github', 'save']"
                style="height: 260px"
                @update:model-value="onDescriptionChange"
              />
            </ClientOnly>
          </div>

          <TagPicker
            :assigned-tags="card.tags"
            :board-tags="boardTags"
            @add="handleAddTag"
            @remove="handleRemoveTag"
            @create="handleCreateTag"
          />

          <ChildTaskList
            :children="card.children"
            @add="handleAddChildCard"
            @open-fullscreen="openChildFullscreen"
          />

          <SubtaskList
            :subtasks="card.subtasks"
            @add="handleAddSubtask"
            @toggle="handleToggleSubtask"
            @remove="handleRemoveSubtask"
          />

          <TimeTracker
            :card-id="activeCardId"
            @changed="refreshActivity"
          />

          <div class="flex flex-col gap-3">
            <span class="text-[11.5px] font-extrabold uppercase tracking-wide text-muted">
              Comments &middot; {{ card.comments.length }}
            </span>

            <div class="flex flex-col gap-4">
              <div
                v-for="comment in card.comments"
                :key="comment.id"
                class="group flex flex-col gap-1.5"
              >
                <div class="flex items-center justify-between">
                  <span class="text-[11px] text-muted">
                    {{ new Date(comment.createdAt).toLocaleString() }}
                  </span>
                  <UButton
                    icon="i-lucide-trash-2"
                    size="xs"
                    color="neutral"
                    variant="ghost"
                    class="opacity-0 group-hover:opacity-100"
                    @click="removeComment(comment.id)"
                  />
                </div>
                <ClientOnly>
                  <MdPreview
                    :model-value="comment.body"
                    language="en-US"
                    preview-theme="default"
                    class="text-[13px]"
                  />
                </ClientOnly>
              </div>
            </div>

            <ClientOnly>
              <MdEditor
                v-model="newComment"
                language="en-US"
                preview-theme="default"
                :preview="!isMobile"
                :toolbars-exclude="['github', 'save']"
                style="height: 160px"
              />
            </ClientOnly>
            <UButton
              label="Comment"
              size="sm"
              class="self-end"
              :loading="postingComment"
              :disabled="!newComment.trim()"
              @click="submitComment"
            />
          </div>

          <ActivityFeed :entries="activityEntries" />
        </div>
      </div>
    </template>
  </UModal>
</template>
