export interface BoardTemplate {
  id: string
  name: string
  builtin: boolean
  columns: { name: string, color: string }[]
  tags: { name: string, color: string }[]
}

export function useBoardTemplates() {
  const templates = ref<BoardTemplate[]>([])

  async function refresh() {
    templates.value = await $fetch<BoardTemplate[]>('/api/board-templates')
  }

  async function saveFromBoard(boardId: number, name: string) {
    const template = await $fetch<BoardTemplate>('/api/board-templates', { method: 'POST', body: { boardId, name } })
    await refresh()
    return template
  }

  async function deleteTemplate(id: string) {
    await $fetch(`/api/board-templates/${id}`, { method: 'DELETE' })
    templates.value = templates.value.filter(t => t.id !== id)
  }

  return { templates, refresh, saveFromBoard, deleteTemplate }
}
