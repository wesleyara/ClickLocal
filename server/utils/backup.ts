import { isAbsolute, resolve } from 'node:path'

export const DB_ENTRY = 'clicklocal.db'
export const MANIFEST_ENTRY = 'manifest.json'
export const UPLOADS_PREFIX = 'uploads/'

/** Safety ceiling for an uploaded backup and for what it expands to. Restoring never buffers the data in memory. */
export const MAX_RESTORE_BYTES = 20 * 1024 * 1024 * 1024
export const KEEP_PRE_RESTORE = 3

const UPLOAD_NAME = /^[\w.-]+$/

/** Raised for problems the user can fix (bad zip, incompatible backup) — endpoints turn it into a 400. */
export class BackupError extends Error {}

export interface BackupManifest {
  app: string
  createdAt: string
  migrations: string[]
}

/** Prisma resolves a relative `file:` URL against the schema's directory (`prisma/`), not the cwd. */
export function resolveDbPath(url = process.env.DATABASE_URL) {
  if (!url?.startsWith('file:')) {
    throw new BackupError('DATABASE_URL precisa ser um arquivo SQLite (file:...)')
  }
  const path = url.slice('file:'.length).split('?')[0]!
  return isAbsolute(path) ? path : resolve(process.cwd(), 'prisma', path)
}

/** Classifies a zip entry; anything outside the backup layout (or with an unsafe name) is rejected. */
export function classifyEntry(name: string): { kind: 'db' | 'manifest' | 'dir' } | { kind: 'upload', fileName: string } {
  if (name === DB_ENTRY) return { kind: 'db' }
  if (name === MANIFEST_ENTRY) return { kind: 'manifest' }
  if (name === UPLOADS_PREFIX) return { kind: 'dir' }

  if (name.startsWith(UPLOADS_PREFIX)) {
    const fileName = name.slice(UPLOADS_PREFIX.length)
    if (UPLOAD_NAME.test(fileName) && fileName !== '.' && fileName !== '..') {
      return { kind: 'upload', fileName }
    }
  }
  throw new BackupError(`O .zip contém uma entrada inesperada ou insegura: "${name}"`)
}

export interface DbInspection {
  integrity: string
  tables: string[]
  migrations: string[]
}

const CORE_TABLES = ['boards', 'board_columns', 'cards', 'attachments']

/** Pure decision step: `null` means the backup can be restored, otherwise the reason it can't. */
export function checkCompatibility(backup: DbInspection, live: Pick<DbInspection, 'tables' | 'migrations'>) {
  if (backup.integrity !== 'ok') {
    return { error: 'O banco do backup está corrompido (integrity_check falhou)' }
  }

  const missingCore = CORE_TABLES.filter(table => !backup.tables.includes(table))
  if (missingCore.length) {
    return { error: `Não parece um backup do ClickLocal: faltam as tabelas ${missingCore.join(', ')}` }
  }

  const liveMigrations = new Set(live.migrations)
  const newer = backup.migrations.filter(name => !liveMigrations.has(name))
  if (newer.length) {
    return { error: 'O backup foi gerado por uma versão mais nova do ClickLocal. Atualize o app antes de restaurar' }
  }

  const needsMigration = live.migrations.some(name => !backup.migrations.includes(name))
  if (!needsMigration) {
    const missingTables = live.tables.filter(table => !backup.tables.includes(table))
    if (missingTables.length) {
      return { error: `O banco do backup está incompleto: faltam as tabelas ${missingTables.join(', ')}` }
    }
  }

  return { needsMigration }
}
