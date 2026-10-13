export interface TemplateColumn { name: string, color: string }
export interface TemplateTag { name: string, color: string }

export interface BoardTemplateDefinition {
  /** `builtin:<slug>` for code-defined templates, the numeric row id (as string) for saved ones. */
  id: string
  name: string
  builtin: boolean
  columns: TemplateColumn[]
  tags: TemplateTag[]
}

export const BUILTIN_TEMPLATE_PREFIX = 'builtin:'

const PURPLE = '#6d5ce8'
const RED = '#dc4c4c'
const BLUE = '#3b82f6'
const AMBER = '#c17a1f'
const GREEN = '#16a34a'

export const BUILTIN_TEMPLATES: BoardTemplateDefinition[] = [
  {
    id: `${BUILTIN_TEMPLATE_PREFIX}blank`,
    name: 'Vazio',
    builtin: true,
    columns: [],
    tags: []
  },
  {
    id: `${BUILTIN_TEMPLATE_PREFIX}kanban-dev`,
    name: 'Kanban dev',
    builtin: true,
    columns: [
      { name: 'TO-DO', color: PURPLE },
      { name: 'Bugs', color: RED },
      { name: 'In-progress', color: BLUE },
      { name: 'Testing', color: AMBER },
      { name: 'Done', color: GREEN }
    ],
    tags: []
  },
  {
    id: `${BUILTIN_TEMPLATE_PREFIX}simple`,
    name: 'To do / Doing / Done',
    builtin: true,
    columns: [
      { name: 'To do', color: PURPLE },
      { name: 'Doing', color: BLUE },
      { name: 'Done', color: GREEN }
    ],
    tags: []
  }
]
