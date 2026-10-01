import { boardRepository } from '../repositories/boardRepository'
import { boardTemplateRepository } from '../repositories/boardTemplateRepository'
import type { BoardTemplateDefinition } from '../utils/boardTemplates'
import { BUILTIN_TEMPLATES, BUILTIN_TEMPLATE_PREFIX } from '../utils/boardTemplates'
import { nextPosition } from '../utils/position'

type SavedTemplate = NonNullable<Awaited<ReturnType<typeof boardTemplateRepository.findById>>>

function toDefinition(template: SavedTemplate): BoardTemplateDefinition {
  return {
    id: String(template.id),
    name: template.name,
    builtin: false,
    columns: template.columns.map(({ name, color }) => ({ name, color })),
    tags: template.tags.map(({ name, color }) => ({ name, color }))
  }
}

export async function listTemplates(): Promise<BoardTemplateDefinition[]> {
  const saved = await boardTemplateRepository.findMany()
  return [...BUILTIN_TEMPLATES, ...saved.map(toDefinition)]
}

/** Returns null when the id doesn't match any built-in or saved template. */
export async function resolveTemplate(id: string): Promise<BoardTemplateDefinition | null> {
  if (id.startsWith(BUILTIN_TEMPLATE_PREFIX)) {
    return BUILTIN_TEMPLATES.find(t => t.id === id) ?? null
  }

  const numericId = Number(id)
  if (!Number.isInteger(numericId)) return null

  const saved = await boardTemplateRepository.findById(numericId)
  return saved ? toDefinition(saved) : null
}

/** Column/tag rows for a nested `board.create`, spaced with the usual gap-based positions. */
export function templateToBoardCreateData(template: BoardTemplateDefinition) {
  let position: number | undefined
  return {
    columns: {
      create: template.columns.map((column) => {
        position = nextPosition(position)
        return { name: column.name, color: column.color, position }
      })
    },
    tags: { create: template.tags.map(({ name, color }) => ({ name, color })) }
  }
}

export async function createTemplateFromBoard(boardId: number, name: string) {
  const board = await boardRepository.findByIdWithStructure(boardId)
  if (!board) return null

  let position: number | undefined
  const saved = await boardTemplateRepository.create({
    name: name.trim(),
    columns: {
      create: board.columns.map((column) => {
        position = nextPosition(position)
        return { name: column.name, color: column.color, position }
      })
    },
    tags: { create: board.tags.map(({ name, color }) => ({ name, color })) }
  })

  return toDefinition(saved)
}

export type DeleteTemplateResult = 'deleted' | 'not_found' | 'builtin'

export async function deleteTemplate(id: string): Promise<DeleteTemplateResult> {
  if (id.startsWith(BUILTIN_TEMPLATE_PREFIX)) return 'builtin'

  const numericId = Number(id)
  if (!Number.isInteger(numericId) || !(await boardTemplateRepository.findById(numericId))) return 'not_found'

  await boardTemplateRepository.delete(numericId)
  return 'deleted'
}
