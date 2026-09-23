export interface CardComment {
  id: number
  cardId: number
  body: string
  adoCommentId: number | null
  createdAt: string
  updatedAt: string
}

export interface CardSubtask {
  id: number
  cardId: number
  title: string
  completed: boolean
  position: number
}

export interface CardTag {
  id: number
  boardId: number
  name: string
  color: string
}

export interface CardParentSummary {
  id: number
  title: string
}

export interface CardChildSummary {
  id: number
  title: string
  description: string | null
  dueDate: string | null
  archived: boolean
  tags: CardTag[]
  subtaskCount: number
  subtaskDoneCount: number
  childCount: number
}

export interface CardAdoSummary {
  adoId: number
  project: string
  type: string
  state: string
  descriptionHtml: string | null
  url: string
  parentAdoId: number | null
  parentTitle: string | null
  parentType: string | null
  supportsCompletedWork: boolean
}

export interface CardDetail {
  id: number
  columnId: number
  title: string
  description: string | null
  position: number
  dueDate: string | null
  archived: boolean
  comments: CardComment[]
  subtasks: CardSubtask[]
  tags: CardTag[]
  parent: CardParentSummary | null
  children: CardChildSummary[]
  ado: CardAdoSummary | null
}

export function useCard(id: Ref<number | null>) {
  const card = ref<CardDetail | null>(null)
  const pending = ref(false)

  async function refresh() {
    if (!id.value) {
      card.value = null
      return
    }
    pending.value = true
    try {
      card.value = await $fetch<CardDetail>(`/api/cards/${id.value}`)
    } finally {
      pending.value = false
    }
  }

  watch(id, refresh, { immediate: true })

  async function saveDescription(description: string) {
    if (!card.value) return
    await $fetch(`/api/cards/${card.value.id}`, { method: 'PATCH', body: { description } })
    card.value.description = description
  }

  async function saveTitle(title: string) {
    if (!card.value) return
    await $fetch(`/api/cards/${card.value.id}`, { method: 'PATCH', body: { title } })
    card.value.title = title
  }

  async function addComment(body: string) {
    if (!card.value) return
    const comment = await $fetch<CardComment>(`/api/cards/${card.value.id}/comments`, {
      method: 'POST',
      body: { body }
    })
    card.value.comments.push(comment)
  }

  async function removeComment(commentId: number) {
    if (!card.value) return
    await $fetch(`/api/comments/${commentId}`, { method: 'DELETE' })
    card.value.comments = card.value.comments.filter(c => c.id !== commentId)
  }

  async function publishComment(commentId: number) {
    if (!card.value) return
    const result = await $fetch<{ dryRun: boolean, adoCommentId: number | null }>(`/api/comments/${commentId}/publish`, { method: 'POST' })
    if (!result.dryRun) {
      const comment = card.value.comments.find(c => c.id === commentId)
      if (comment) comment.adoCommentId = result.adoCommentId
    }
    return result
  }

  async function addSubtask(title: string) {
    if (!card.value) return
    const subtask = await $fetch<CardSubtask>(`/api/cards/${card.value.id}/subtasks`, {
      method: 'POST',
      body: { title }
    })
    card.value.subtasks.push(subtask)
  }

  async function toggleSubtask(subtaskId: number, completed: boolean) {
    if (!card.value) return
    await $fetch(`/api/subtasks/${subtaskId}`, { method: 'PATCH', body: { completed } })
    const subtask = card.value.subtasks.find(s => s.id === subtaskId)
    if (subtask) subtask.completed = completed
  }

  async function renameSubtask(subtaskId: number, title: string) {
    if (!card.value) return
    await $fetch(`/api/subtasks/${subtaskId}`, { method: 'PATCH', body: { title } })
    const subtask = card.value.subtasks.find(s => s.id === subtaskId)
    if (subtask) subtask.title = title
  }

  async function removeSubtask(subtaskId: number) {
    if (!card.value) return
    await $fetch(`/api/subtasks/${subtaskId}`, { method: 'DELETE' })
    card.value.subtasks = card.value.subtasks.filter(s => s.id !== subtaskId)
  }

  async function addTag(tag: CardTag) {
    if (!card.value) return
    await $fetch(`/api/cards/${card.value.id}/tags`, { method: 'POST', body: { tagId: tag.id } })
    card.value.tags.push(tag)
  }

  async function removeTag(tagId: number) {
    if (!card.value) return
    await $fetch(`/api/cards/${card.value.id}/tags/${tagId}`, { method: 'DELETE' })
    card.value.tags = card.value.tags.filter(t => t.id !== tagId)
  }

  async function setArchived(archived: boolean) {
    if (!card.value) return
    await $fetch(`/api/cards/${card.value.id}`, { method: 'PATCH', body: { archived } })
    card.value.archived = archived
  }

  async function uploadImages(files: File[]) {
    if (!card.value) return []
    const formData = new FormData()
    for (const file of files) formData.append('files', file)
    const attachments = await $fetch<{ id: number, url: string }[]>(`/api/cards/${card.value.id}/attachments`, {
      method: 'POST',
      body: formData
    })
    return attachments.map(a => a.url)
  }

  async function addChildCard(title: string) {
    if (!card.value) return
    const child = await $fetch<{ id: number, title: string }>(`/api/cards/${card.value.id}/children`, {
      method: 'POST',
      body: { title }
    })
    card.value.children.push({
      id: child.id,
      title: child.title,
      description: null,
      dueDate: null,
      archived: false,
      tags: [],
      subtaskCount: 0,
      subtaskDoneCount: 0,
      childCount: 0
    })
    return child
  }

  return {
    card,
    pending,
    refresh,
    saveDescription,
    saveTitle,
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
    uploadImages
  }
}
