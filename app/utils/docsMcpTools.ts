export interface McpTool {
  name: string
  params: string
  description: string
}

export interface McpToolGroup {
  title: string
  tools: McpTool[]
}

/** Mirrors `mcp-server/src/tools/*.ts`. Params ending in `?` are optional. */
export const mcpToolGroups: McpToolGroup[] = [
  {
    title: 'Boards',
    tools: [
      { name: 'clicklocal_list_boards', params: 'nenhum', description: 'Lista os boards (exceto o do Azure DevOps)' },
      { name: 'clicklocal_get_board', params: 'boardId', description: 'Board com colunas e cards não arquivados' },
      { name: 'clicklocal_list_board_tags', params: 'boardId', description: 'Lista as tags do board' },
      { name: 'clicklocal_create_board_tag', params: 'boardId, name, color', description: 'Cria tag; a cor é um hex, como #6d5ce8' },
      { name: 'clicklocal_list_archived_cards', params: 'boardId', description: 'Lista os cards arquivados' }
    ]
  },
  {
    title: 'Cards',
    tools: [
      { name: 'clicklocal_list_cards', params: 'boardId, columnId?, includeArchived?', description: 'Lista cards, com filtro por coluna e opção de incluir arquivados' },
      { name: 'clicklocal_get_card', params: 'cardId', description: 'Detalhes: tags, filhos e vínculo com o ADO, se houver' },
      { name: 'clicklocal_create_card', params: 'columnId, title, description?', description: 'Cria um card; a descrição é Markdown' },
      { name: 'clicklocal_create_child_card', params: 'parentCardId, title', description: 'Cria um card filho' },
      { name: 'clicklocal_update_card', params: 'cardId, title?, description?, columnId?, dueDate?, archived?', description: 'Edita, move de coluna ou arquiva. Exige ao menos um campo. dueDate é ISO 8601 ou null' },
      { name: 'clicklocal_delete_card', params: 'cardId', description: 'Exclui o card' }
    ]
  },
  {
    title: 'Tags em cards',
    tools: [
      { name: 'clicklocal_attach_tag_to_card', params: 'cardId, tagId', description: 'Associa uma tag existente' },
      { name: 'clicklocal_detach_tag_from_card', params: 'cardId, tagId', description: 'Remove a associação' }
    ]
  },
  {
    title: 'Subtarefas',
    tools: [
      { name: 'clicklocal_create_subtask', params: 'cardId, title', description: 'Cria uma subtarefa' },
      { name: 'clicklocal_update_subtask', params: 'cardId, subtaskId, title?, completed?', description: 'Renomeia e/ou marca como concluída (informe ao menos um)' },
      { name: 'clicklocal_delete_subtask', params: 'cardId, subtaskId', description: 'Exclui a subtarefa' }
    ]
  },
  {
    title: 'Comentários',
    tools: [
      { name: 'clicklocal_list_comments', params: 'cardId', description: 'Lista os comentários' },
      { name: 'clicklocal_add_comment', params: 'cardId, body', description: 'Adiciona comentário em Markdown' },
      { name: 'clicklocal_update_comment', params: 'cardId, commentId, body', description: 'Edita o comentário' },
      { name: 'clicklocal_delete_comment', params: 'cardId, commentId', description: 'Exclui o comentário' }
    ]
  },
  {
    title: 'Horas',
    tools: [
      { name: 'clicklocal_list_time_entries', params: 'cardId', description: 'Lista os registros de tempo' },
      { name: 'clicklocal_log_time_entry', params: 'cardId, startedAt, durationMs, note?', description: 'Registra horas. startedAt é ISO 8601 e durationMs está em milissegundos' },
      { name: 'clicklocal_delete_time_entry', params: 'cardId, timeEntryId', description: 'Exclui o registro. Falha se já foi enviado ao ADO' }
    ]
  }
]
