import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { registerBoardTools } from './tools/boards.js'
import { registerCardTools } from './tools/cards.js'
import { registerColumnTools } from './tools/columns.js'
import { registerTemplateTools } from './tools/templates.js'
import { registerTagTools } from './tools/tags.js'
import { registerSubtaskTools } from './tools/subtasks.js'
import { registerCommentTools } from './tools/comments.js'
import { registerTimeEntryTools } from './tools/time-entries.js'

export function buildServer(): McpServer {
  const server = new McpServer({
    name: 'clicklocal-mcp',
    version: '0.1.0'
  })

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
