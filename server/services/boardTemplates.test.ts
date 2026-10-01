import { beforeEach, describe, expect, it, vi } from 'vitest'

const findByIdWithStructure = vi.fn()
const findLastByPosition = vi.fn()
const boardCreate = vi.fn()
const templateFindById = vi.fn()
const templateFindMany = vi.fn()
const templateCreate = vi.fn()
const templateDelete = vi.fn()

vi.mock('../repositories/boardRepository', () => ({
  boardRepository: { findByIdWithStructure, findLastByPosition, create: boardCreate }
}))

vi.mock('../repositories/boardTemplateRepository', () => ({
  boardTemplateRepository: { findById: templateFindById, findMany: templateFindMany, create: templateCreate, delete: templateDelete }
}))

const { createBoard, TemplateNotFoundError } = await import('./boards')
const { createTemplateFromBoard, deleteTemplate, listTemplates } = await import('./boardTemplates')

beforeEach(() => {
  vi.resetAllMocks()
  findLastByPosition.mockResolvedValue({ position: 1000 })
  boardCreate.mockImplementation(async data => ({ id: 1, ...data }))
})

describe('createBoard with a template', () => {
  it('creates the built-in Kanban columns with colors and gap-based positions', async () => {
    await createBoard({ name: ' Capp ', templateId: 'builtin:kanban-dev' })

    const data = boardCreate.mock.calls[0]![0]
    expect(data.name).toBe('Capp')
    expect(data.position).toBe(2000)
    expect(data.columns.create).toEqual([
      { name: 'TO-DO', color: '#6d5ce8', position: 1000 },
      { name: 'Bugs', color: '#dc4c4c', position: 2000 },
      { name: 'In-progress', color: '#3b82f6', position: 3000 },
      { name: 'Testing', color: '#c17a1f', position: 4000 },
      { name: 'Done', color: '#16a34a', position: 5000 }
    ])
  })

  it('creates a saved template with its columns and tags', async () => {
    templateFindById.mockResolvedValue({
      id: 7,
      name: 'Meu',
      columns: [{ name: 'A', color: '#111111', position: 1000 }],
      tags: [{ name: 'urgente', color: '#222222' }]
    })

    await createBoard({ name: 'X', templateId: '7' })

    const data = boardCreate.mock.calls[0]![0]
    expect(data.columns.create).toEqual([{ name: 'A', color: '#111111', position: 1000 }])
    expect(data.tags.create).toEqual([{ name: 'urgente', color: '#222222' }])
  })

  it('creates no columns without a template', async () => {
    await createBoard({ name: 'X' })
    expect(boardCreate.mock.calls[0]![0].columns).toBeUndefined()
  })

  it('rejects an unknown template', async () => {
    templateFindById.mockResolvedValue(null)
    await expect(createBoard({ name: 'X', templateId: '99' })).rejects.toBeInstanceOf(TemplateNotFoundError)
    await expect(createBoard({ name: 'X', templateId: 'builtin:nope' })).rejects.toBeInstanceOf(TemplateNotFoundError)
    expect(boardCreate).not.toHaveBeenCalled()
  })
})

describe('createTemplateFromBoard', () => {
  it('copies columns and tags, without ADO state categories', async () => {
    findByIdWithStructure.mockResolvedValue({
      columns: [{ name: 'A', color: '#111111' }, { name: 'B', color: '#222222' }],
      tags: [{ name: 't', color: '#333333' }]
    })
    templateCreate.mockImplementation(async data => ({ id: 3, name: data.name, columns: data.columns.create, tags: data.tags.create }))

    const result = await createTemplateFromBoard(1, ' Modelo ')

    const data = templateCreate.mock.calls[0]![0]
    expect(data.name).toBe('Modelo')
    expect(data.columns.create).toEqual([
      { name: 'A', color: '#111111', position: 1000 },
      { name: 'B', color: '#222222', position: 2000 }
    ])
    expect(JSON.stringify(data)).not.toMatch(/adoStateCategory/)
    expect(result).toMatchObject({ id: '3', builtin: false })
  })

  it('returns null when the board does not exist', async () => {
    findByIdWithStructure.mockResolvedValue(null)
    expect(await createTemplateFromBoard(1, 'x')).toBeNull()
    expect(templateCreate).not.toHaveBeenCalled()
  })
})

describe('listTemplates / deleteTemplate', () => {
  it('lists built-ins first, then saved templates', async () => {
    templateFindMany.mockResolvedValue([{ id: 5, name: 'Salvo', columns: [], tags: [] }])
    const list = await listTemplates()
    expect(list[0]!.builtin).toBe(true)
    expect(list.at(-1)).toMatchObject({ id: '5', builtin: false })
  })

  it('refuses to delete a built-in template', async () => {
    expect(await deleteTemplate('builtin:kanban-dev')).toBe('builtin')
    expect(templateDelete).not.toHaveBeenCalled()
  })

  it('deletes a saved template, and reports a missing one', async () => {
    templateFindById.mockResolvedValueOnce({ id: 5 })
    expect(await deleteTemplate('5')).toBe('deleted')
    expect(templateDelete).toHaveBeenCalledWith(5)

    templateFindById.mockResolvedValueOnce(null)
    expect(await deleteTemplate('6')).toBe('not_found')
  })
})
