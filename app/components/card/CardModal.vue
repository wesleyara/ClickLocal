<script setup lang="ts">
import DOMPurify from 'dompurify'
import { MdPreview } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'

const props = defineProps<{ cardId: number | null, boardId: number }>()
const emit = defineEmits<{ close: [] }>()

const { refresh: refreshAdoConnection, workItemUrl } = useAdoConnection()
refreshAdoConnection()

const boardIdRef = toRef(props, 'boardId')

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
function openChild(id: number) {
  // preserves whatever view (fullscreen or windowed) the modal is already in
  stack.value.push(id)
}

const {
  card,
  saveDescription,
  addComment,
  removeComment,
  publishComment,
  addSubtask,
  toggleSubtask,
  renameSubtask,
  removeSubtask,
  addTag,
  removeTag,
  setArchived,
  addChildCard,
  saveTitle,
  uploadImages
} = useCard(activeCardId)

const sanitizedAdoDescription = computed(() => {
  const html = card.value?.ado?.descriptionHtml
  return html ? DOMPurify.sanitize(html) : ''
})

const parentBreadcrumbUrl = computed(() => {
  const ado = card.value?.ado
  if (!ado?.parentAdoId) return null
  return workItemUrl(ado.project, ado.parentAdoId)
})

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
const descriptionDirty = ref(false)

watch(() => card.value?.id, () => {
  descriptionDraft.value = card.value?.description ?? ''
  descriptionDirty.value = false
  editingTitle.value = false
})

function onDescriptionChange(value: string) {
  descriptionDraft.value = value
  descriptionDirty.value = value !== (card.value?.description ?? '')
}

async function submitDescription() {
  if (!descriptionDirty.value) return
  savingDescription.value = true
  await saveDescription(descriptionDraft.value)
  descriptionDirty.value = false
  savingDescription.value = false
  await refreshActivity()
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

async function handleRenameSubtask(id: number, title: string) {
  await renameSubtask(id, title)
  await refreshActivity()
}

const editingTitle = ref(false)
const titleDraft = ref('')

function startEditTitle() {
  if (!card.value) return
  titleDraft.value = card.value.title
  editingTitle.value = true
}

async function submitTitle() {
  editingTitle.value = false
  const title = titleDraft.value.trim()
  if (!title || title === card.value?.title) return
  await saveTitle(title)
  await refreshActivity()
}

const toast = useToast()
const { confirm } = useConfirm()
const lightbox = useTemplateRef('lightbox')

function onMarkdownClick(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (target.tagName === 'IMG' && target.closest('.md-editor-preview')) {
    lightbox.value?.open((target as HTMLImageElement).src)
  }
}

async function handleUploadImg(files: File[], callback: (urls: string[]) => void) {
  try {
    const urls = await uploadImages(files)
    callback(urls)
  } catch {
    toast.add({ title: 'Failed to upload image', color: 'error' })
  }
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

async function handlePublishComment(commentId: number, body: string) {
  const ok = await confirm({
    title: 'Publicar comentário no Azure DevOps?',
    description: body.length > 280 ? `${body.slice(0, 280)}…` : body,
    confirmLabel: 'Publicar'
  })
  if (!ok) return
  await publishComment(commentId)
  await refreshActivity()
}

interface AdoDiscussionComment {
  id: number
  text: string
  author: string
  createdDate: string
}

const commentsTab = ref<'local' | 'ado'>('local')
const adoDiscussion = ref<AdoDiscussionComment[]>([])
const loadingAdoDiscussion = ref(false)
const adoDiscussionError = ref<string | null>(null)

watch(() => card.value?.id, () => {
  commentsTab.value = 'local'
})

watch(commentsTab, async (tab) => {
  if (tab !== 'ado' || !activeCardId.value) return
  loadingAdoDiscussion.value = true
  adoDiscussionError.value = null
  try {
    adoDiscussion.value = await $fetch<AdoDiscussionComment[]>(`/api/cards/${activeCardId.value}/ado-discussion`)
  } catch (error) {
    adoDiscussionError.value = (error as { data?: { statusMessage?: string } })?.data?.statusMessage ?? 'Falha ao carregar a Discussion do Azure DevOps'
  } finally {
    loadingAdoDiscussion.value = false
  }
})
</script>

<template>
  <UModal
    v-model:open="open"
    :fullscreen="fullscreen"
    :ui="{ content: fullscreen ? '' : 'sm:max-w-3xl lg:max-w-5xl' }"
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
            <div
              v-if="card.ado"
              class="flex items-center gap-1 text-[11px] font-bold text-muted mb-1 flex-wrap"
            >
              <span>{{ card.ado.project }}</span>
              <template v-if="card.ado.parentAdoId">
                <UIcon
                  name="i-lucide-chevron-right"
                  class="size-3"
                />
                <a
                  v-if="parentBreadcrumbUrl"
                  :href="parentBreadcrumbUrl"
                  target="_blank"
                  rel="noopener"
                  class="hover:text-default hover:underline"
                >{{ card.ado.parentType }} #{{ card.ado.parentAdoId }} {{ card.ado.parentTitle }}</a>
                <span v-else>{{ card.ado.parentType }} #{{ card.ado.parentAdoId }} {{ card.ado.parentTitle }}</span>
              </template>
            </div>
            <span class="inline-block text-[11px] font-bold font-mono text-muted mb-0.5">
              #{{ card.id }}
            </span>
            <UInput
              v-if="editingTitle"
              v-model="titleDraft"
              autofocus
              size="lg"
              :ui="{ base: 'text-[17px] sm:text-[19px] font-extrabold tracking-tight' }"
              class="w-full"
              @keydown.enter="submitTitle"
              @keydown.esc="editingTitle = false"
              @blur="submitTitle"
            />
            <p
              v-else
              class="text-[17px] sm:text-[19px] font-extrabold tracking-tight leading-snug"
              :class="card.ado ? '' : 'cursor-text hover:opacity-80'"
              @click="card.ado ? undefined : startEditTitle()"
            >
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
              v-if="card.ado"
              icon="i-lucide-external-link"
              size="xs"
              color="neutral"
              variant="ghost"
              :to="workItemUrl(card.ado.project, card.ado.adoId) ?? undefined"
              target="_blank"
            >
              <span class="hidden sm:inline">Abrir no ADO</span>
            </UButton>
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

        <div
          class="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5"
          @click="onMarkdownClick"
        >
          <div class="flex flex-col gap-8 lg:grid lg:grid-cols-3 lg:gap-9 lg:items-start">
            <div class="flex flex-col gap-8 lg:col-span-2 lg:min-w-0">
              <div class="flex flex-col gap-2">
                <div class="flex items-center justify-between">
                  <span class="text-[11.5px] font-extrabold uppercase tracking-wide text-muted">Description</span>
                  <UButton
                    v-if="!card.ado"
                    label="Salvar"
                    icon="i-lucide-check"
                    size="xs"
                    :color="descriptionDirty ? 'primary' : 'neutral'"
                    :variant="descriptionDirty ? 'soft' : 'ghost'"
                    :loading="savingDescription"
                    :disabled="!descriptionDirty"
                    class="disabled:opacity-40"
                    @click="submitDescription"
                  />
                </div>
                <div
                  v-if="card.ado"
                  class="border border-default rounded-lg p-3 text-[13px] leading-relaxed [&_a]:text-primary [&_a]:underline [&_img]:max-w-full [&_img]:rounded-md"
                  v-html="sanitizedAdoDescription || '<p class=\'text-muted\'>Sem descrição</p>'"
                />
                <MarkdownEditor
                  v-else
                  :model-value="descriptionDraft"
                  height="300px"
                  :on-upload-img="handleUploadImg"
                  @update:model-value="onDescriptionChange"
                />
              </div>

              <SubtaskList
                :subtasks="card.subtasks"
                @add="handleAddSubtask"
                @toggle="handleToggleSubtask"
                @remove="handleRemoveSubtask"
                @rename="handleRenameSubtask"
              />

              <div class="flex flex-col gap-3">
                <div
                  v-if="card.ado"
                  class="flex items-center gap-4 border-b border-default"
                >
                  <button
                    class="text-[11.5px] font-extrabold uppercase tracking-wide pb-2 -mb-px border-b-2"
                    :class="commentsTab === 'local' ? 'text-default border-primary' : 'text-muted border-transparent'"
                    @click="commentsTab = 'local'"
                  >
                    Comments &middot; {{ card.comments.length }}
                  </button>
                  <button
                    class="text-[11.5px] font-extrabold uppercase tracking-wide pb-2 -mb-px border-b-2"
                    :class="commentsTab === 'ado' ? 'text-default border-primary' : 'text-muted border-transparent'"
                    @click="commentsTab = 'ado'"
                  >
                    Discussion (ADO)
                  </button>
                </div>
                <span
                  v-else
                  class="text-[11.5px] font-extrabold uppercase tracking-wide text-muted"
                >
                  Comments &middot; {{ card.comments.length }}
                </span>

                <template v-if="commentsTab === 'ado' && card.ado">
                  <p
                    v-if="loadingAdoDiscussion"
                    class="text-[12.5px] text-muted"
                  >
                    Carregando...
                  </p>
                  <p
                    v-else-if="adoDiscussionError"
                    class="text-[12.5px] text-error"
                  >
                    {{ adoDiscussionError }}
                  </p>
                  <p
                    v-else-if="adoDiscussion.length === 0"
                    class="text-[12.5px] text-muted"
                  >
                    Nenhum comentário no Azure DevOps.
                  </p>
                  <div
                    v-else
                    class="flex flex-col gap-4"
                  >
                    <div
                      v-for="discussionComment in adoDiscussion"
                      :key="discussionComment.id"
                      class="flex flex-col gap-1.5"
                    >
                      <span class="text-[11px] text-muted">
                        {{ discussionComment.author }} &middot; {{ new Date(discussionComment.createdDate).toLocaleString() }}
                      </span>
                      <div
                        class="text-[13px] leading-relaxed [&_a]:text-primary [&_a]:underline"
                        v-html="DOMPurify.sanitize(discussionComment.text)"
                      />
                    </div>
                  </div>
                </template>

                <template v-else>
                  <div class="flex flex-col gap-4">
                    <div
                      v-for="comment in card.comments"
                      :key="comment.id"
                      class="group flex flex-col gap-1.5"
                    >
                      <div class="flex items-center justify-between">
                        <span class="flex items-center gap-2 text-[11px] text-muted">
                          {{ new Date(comment.createdAt).toLocaleString() }}
                          <span
                            v-if="comment.adoCommentId"
                            class="inline-flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 rounded-md px-1.5 py-0.5"
                          >
                            <UIcon
                              name="i-lucide-check"
                              class="size-2.5"
                            />
                            Publicado
                          </span>
                        </span>
                        <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                          <UButton
                            v-if="card.ado && !comment.adoCommentId"
                            label="Publicar no ADO"
                            size="xs"
                            color="neutral"
                            variant="ghost"
                            @click="handlePublishComment(comment.id, comment.body)"
                          />
                          <UButton
                            icon="i-lucide-trash-2"
                            size="xs"
                            color="neutral"
                            variant="ghost"
                            @click="removeComment(comment.id)"
                          />
                        </div>
                      </div>
                      <ClientOnly>
                        <MdPreview
                          :model-value="comment.body"
                          language="en-US"
                          preview-theme="default"
                          class="text-[13px]"
                          :no-img-zoom-in="true"
                          :show-code-row-number="true"
                        />
                      </ClientOnly>
                    </div>
                  </div>

                  <MarkdownEditor
                    v-model="newComment"
                    height="160px"
                    :on-upload-img="handleUploadImg"
                  />
                  <UButton
                    label="Comment"
                    size="sm"
                    class="self-end"
                    :loading="postingComment"
                    :disabled="!newComment.trim()"
                    @click="submitComment"
                  />
                </template>
              </div>
            </div>

            <div class="flex flex-col gap-8 lg:col-span-1 lg:sticky lg:top-0">
              <TagPicker
                :assigned-tags="card.tags"
                :board-tags="boardTags"
                @add="handleAddTag"
                @remove="handleRemoveTag"
                @create="handleCreateTag"
              />

              <TimeTracker
                :card-id="activeCardId"
                :ado="card.ado"
                @changed="refreshActivity"
              />

              <ChildTaskList
                :children="card.children"
                @add="handleAddChildCard"
                @open="openChild"
              />

              <ActivityFeed :entries="activityEntries" />
            </div>
          </div>
        </div>
      </div>
    </template>
  </UModal>
  <ImageLightbox ref="lightbox" />
</template>
