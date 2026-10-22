import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { registerBoardTools } from './tools/boards.js'
import { registerCardTools } from './tools/cards.js'
import { registerColumnTools } from './tools/columns.js'
import { registerTemplateTools } from './tools/templates.js'
import { registerTagTools } from './tools/tags.js'
import { registerSubtaskTools } from './tools/subtasks.js'
import { registerCommentTools } from './tools/comments.js'
import { registerTimeEntryTools } from './tools/time-entries.js'

const INSTRUCTIONS = `Cards do ClickLocal são o registro oficial das tasks. Ao trabalhar em um card (pedidos como "faça a task 12"):
1. Leia o card inteiro (clicklocal_get_card e clicklocal_list_comments).
2. ANTES de editar código, sinalize o início no card: mova-o para a coluna de andamento, se o board tiver uma (clicklocal_update_card); caso contrário, comente que começou.
3. Em trabalho longo, registre marcos com clicklocal_add_comment.
4. ANTES de encerrar o turno, deixe o card na coluna que corresponde ao resultado, se o board tiver uma (concluído, ou validação se faltar verificação; nunca force colunas inexistentes) e comente o que mudou, como foi validado e as pendências. Faça isso também se a task falhar ou ficar bloqueada.
5. Confira com clicklocal_get_card e só então diga ao usuário que terminou. A task não está concluída enquanto o card não refletir o estado real.`

export function buildServer(): McpServer {
  const server = new McpServer({
    name: 'clicklocal-mcp',
    version: '0.1.0'
  }, { instructions: INSTRUCTIONS })

  registerBoardTools(server)
  registerColumnTools(server)
  registerCardTools(server)
  registerTemplateTools(server)
  registerTagTools(server)
  registerSubtaskTools(server)
  registerCommentTools(server)
  registerTimeEntryTools(server)

  return server
}
