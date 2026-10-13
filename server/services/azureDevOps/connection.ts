import { azureDevOpsRepository } from '../../repositories/azureDevOpsRepository'
import { boardRepository } from '../../repositories/boardRepository'
import { connectionData, listProjects } from '../../utils/azureDevOps'
import { db } from '../../utils/db'
import { nextPosition } from '../../utils/position'

export type AdoWriteMode = 'readonly' | 'dry-run' | 'write'

const DEFAULT_COLUMNS: { name: string, category: string }[] = [
  { name: 'A fazer', category: 'Proposed' },
  { name: 'Fazendo', category: 'InProgress' },
  { name: 'Resolvido', category: 'Resolved' },
  { name: 'Concluído', category: 'Completed' }
]

function maskConnection(connection: NonNullable<Awaited<ReturnType<typeof azureDevOpsRepository.findConnection>>>) {
  const { pat: _pat, ...rest } = connection
  return { ...rest, writeAllowedProjects: JSON.parse(rest.writeAllowedProjects) as string[], hasPat: true }
}

export async function getConnection() {
  const connection = await azureDevOpsRepository.findConnection()
  if (!connection) return null
  return maskConnection(connection)
}

export async function testConnection(orgUrl: string, pat: string) {
  return connectionData(orgUrl.trim().replace(/\/+$/, ''), pat)
}

export async function listOrgProjects() {
  const connection = await azureDevOpsRepository.findConnection()
  if (!connection) throw new Error('Conexão com o Azure DevOps não configurada')
  const { value } = await listProjects(connection.orgUrl, connection.pat)
  return value.map(p => p.name)
}

/**
 * Saves the org URL + PAT, verifies them against ADO, and — on the very
 * first save — creates the "Meu trabalho" board with its 4 mapped columns.
 */
export async function saveConnection(input: { orgUrl: string, pat: string }) {
  const orgUrl = input.orgUrl.trim().replace(/\/+$/, '')
  const { userName } = await connectionData(orgUrl, input.pat)

  const existing = await azureDevOpsRepository.findConnection()

  return db.$transaction(async (tx) => {
    let boardId = existing?.boardId ?? null

    if (!boardId) {
      const last = await boardRepository.findLastByPosition()
      const board = await tx.board.create({
        data: {
          name: 'Meu trabalho',
          description: 'Itens atribuídos a mim no Azure DevOps',
          position: nextPosition(last?.position)
        }
      })
      boardId = board.id

      let position = 0
      for (const { name, category } of DEFAULT_COLUMNS) {
        position = nextPosition(position)
        await tx.boardColumn.create({
          data: { name, position, boardId: board.id, adoStateCategory: category }
        })
      }
    }

    const connection = await tx.azureDevOpsConnection.upsert({
      where: { id: 1 },
      create: {
        id: 1,
        orgUrl,
        pat: input.pat,
        userName,
        boardId,
        writeMode: 'readonly',
        writeAllowedProjects: '[]'
      },
      update: { orgUrl, pat: input.pat, userName, boardId }
    })

    return maskConnection(connection)
  })
}

export async function updateWriteSettings(input: { writeMode?: AdoWriteMode, writeAllowedProjects?: string[] }) {
  const data: { writeMode?: string, writeAllowedProjects?: string } = {}
  if (input.writeMode !== undefined) data.writeMode = input.writeMode
  if (input.writeAllowedProjects !== undefined) data.writeAllowedProjects = JSON.stringify(input.writeAllowedProjects)

  const connection = await azureDevOpsRepository.updateConnection(data)
  return maskConnection(connection)
}
