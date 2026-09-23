import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const findConnection = vi.fn()
const logActivity = vi.fn()
const fetchMock = vi.fn()

vi.mock('../repositories/azureDevOpsRepository', () => ({
  azureDevOpsRepository: { findConnection }
}))

vi.mock('./activity', async () => {
  const actual = await vi.importActual<typeof import('./activity')>('./activity')
  return { ...actual, logActivity }
})

vi.mock('ofetch', () => ({ $fetch: fetchMock }))

const { adoWriteGuard } = await import('./azureDevOps')

const baseParams = {
  cardId: 1,
  project: 'Sandbox',
  adoId: 123,
  op: 'patchWorkItem' as const,
  eventType: 'ado_state_pushed' as const,
  activityPayload: { from: 'Active', to: 'Resolved' },
  fields: ['System.State'],
  rev: 5,
  patch: [{ op: 'replace' as const, path: '/fields/System.State', value: 'Resolved' }]
}

beforeEach(() => {
  findConnection.mockReset()
  logActivity.mockReset()
  fetchMock.mockReset()
})

describe('adoWriteGuard', () => {
  it('blocks writes when the connection is in readonly mode', async () => {
    findConnection.mockResolvedValue({ writeMode: 'readonly', writeAllowedProjects: '["Sandbox"]' })

    await expect(adoWriteGuard(baseParams)).rejects.toMatchObject({ statusCode: 403 })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('blocks writes to a project outside the allowlist', async () => {
    findConnection.mockResolvedValue({ writeMode: 'write', writeAllowedProjects: '["OtherProject"]' })

    await expect(adoWriteGuard(baseParams)).rejects.toMatchObject({ statusCode: 403 })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('blocks writes to a field outside the allowlist', async () => {
    findConnection.mockResolvedValue({ writeMode: 'write', writeAllowedProjects: '["Sandbox"]' })

    await expect(adoWriteGuard({ ...baseParams, fields: ['System.Title'] })).rejects.toMatchObject({ statusCode: 403 })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('does not call the ADO API in dry-run mode, and audits the would-be patch', async () => {
    findConnection.mockResolvedValue({ writeMode: 'dry-run', writeAllowedProjects: '["Sandbox"]' })

    const result = await adoWriteGuard(baseParams)

    expect(result.dryRun).toBe(true)
    expect(result.patch).toEqual(baseParams.patch)
    expect(fetchMock).not.toHaveBeenCalled()
    expect(logActivity).toHaveBeenCalledWith(
      baseParams.cardId,
      baseParams.eventType,
      expect.objectContaining({ dryRun: true }),
      expect.anything()
    )
  })

  it('calls the ADO API in write mode and audits the result', async () => {
    findConnection.mockResolvedValue({ writeMode: 'write', writeAllowedProjects: '["Sandbox"]', orgUrl: 'https://dev.azure.com/org', pat: 'secret' })
    fetchMock.mockResolvedValue({ id: 123, rev: 6, fields: {}, url: 'https://dev.azure.com/org/_apis/wit/workitems/123' })

    const result = await adoWriteGuard(baseParams)

    expect(result.dryRun).toBe(false)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [, options] = fetchMock.mock.calls[0] as [string, { body: unknown[] }]
    expect(options.body[0]).toEqual({ op: 'test', path: '/rev', value: 5 })
    expect(logActivity).toHaveBeenCalledWith(
      baseParams.cardId,
      baseParams.eventType,
      expect.objectContaining({ rev: 6 }),
      expect.anything()
    )
  })

  it('blocks an operation that is not patchWorkItem or addComment', async () => {
    findConnection.mockResolvedValue({ writeMode: 'write', writeAllowedProjects: '["Sandbox"]' })

    // @ts-expect-error deliberately invalid op to exercise the allowlist check
    await expect(adoWriteGuard({ ...baseParams, op: 'deleteWorkItem' })).rejects.toMatchObject({ statusCode: 403 })
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('sync.ts', () => {
  it('never imports the write guard', () => {
    const path = join(__dirname, '../services/azureDevOps/sync.ts')
    const source = readFileSync(path, 'utf-8')
    expect(source).not.toMatch(/adoWriteGuard/)
  })
})
