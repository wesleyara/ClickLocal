import type { CardTag } from './useCard'

export function useBoardTags(boardId: Ref<number | null>) {
  const tags = ref<CardTag[]>([])

  async function refresh() {
    if (!boardId.value) {
      tags.value = []
      return
    }
    tags.value = await $fetch<CardTag[]>(`/api/boards/${boardId.value}/tags`)
  }

  watch(boardId, refresh, { immediate: true })

  async function createTag(input: { name: string, color: string }) {
    if (!boardId.value) return
    const tag = await $fetch<CardTag>(`/api/boards/${boardId.value}/tags`, { method: 'POST', body: input })
    tags.value.push(tag)
    return tag
  }

  return { tags, refresh, createTag }
}
