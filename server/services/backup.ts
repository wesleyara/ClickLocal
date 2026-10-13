import { execFile } from 'node:child_process'
import { createWriteStream } from 'node:fs'
import { copyFile, mkdir, mkdtemp, readdir, rename, rm, unlink } from 'node:fs/promises'
import { basename, join } from 'node:path'
import type { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { promisify } from 'node:util'
import { PrismaClient } from '@prisma/client'
import { ZipArchive, type ZipEntryData } from 'archiver'
import {
  BackupError,
  DB_ENTRY,
  KEEP_PRE_RESTORE,
  MANIFEST_ENTRY,
  MAX_RESTORE_BYTES,
  UPLOADS_PREFIX,
  checkCompatibility,
  resolveDbPath,
  type BackupManifest,
  type DbInspection
} from '../utils/backup'
import { extractBackupZip, byteLimit } from '../utils/backupZip'
import { db } from '../utils/db'
import { UPLOAD_DIR } from '../utils/storage'

const run = promisify(execFile)

const DATA_DIR = join(process.cwd(), 'data')
const PRE_RESTORE_DIR = join(DATA_DIR, 'backups')

let restoring = false

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-')
}

async function listUploads() {
  return readdir(UPLOAD_DIR).catch(() => [] as string[])
}

async function inspect(client: Pick<PrismaClient, '$queryRawUnsafe'>): Promise<DbInspection> {
  const [integrity] = await client.$queryRawUnsafe<{ integrity_check: string }[]>('PRAGMA integrity_check')
  const tables = await client.$queryRawUnsafe<{ name: string }[]>(
    `SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'`
  )
  const migrations = await client
    .$queryRawUnsafe<{ migration_name: string }[]>('SELECT migration_name FROM _prisma_migrations')
    .catch(() => [])

  return {
    integrity: integrity?.integrity_check ?? 'unknown',
    tables: tables.map(row => row.name),
    migrations: migrations.map(row => row.migration_name)
  }
}

/** Builds a `clicklocal-backup-<date>.zip` (consistent DB snapshot + uploads) in a temp dir under data/. The caller deletes `dir` when done. */
export async function createBackupFile() {
  // Built next to the data (not in /tmp) so a large backup uses the volume's space, not RAM or a small tmpfs.
  await mkdir(DATA_DIR, { recursive: true })
  const dir = await mkdtemp(join(DATA_DIR, '.backup-'))
  const snapshotPath = join(dir, DB_ENTRY)
  const fileName = `clicklocal-backup-${timestamp()}.zip`
  const zipPath = join(dir, fileName)

  // VACUUM INTO writes a consistent copy even while the app keeps using the database.
  await db.$executeRawUnsafe(`VACUUM INTO '${snapshotPath.replace(/'/g, `''`)}'`)

  const uploads = await listUploads()
  const live = await inspect(db)
  const manifest: BackupManifest = { app: 'clicklocal', createdAt: new Date().toISOString(), migrations: live.migrations }

  const archive = new ZipArchive({ zlib: { level: 6 } })
  const written = pipeline(archive, createWriteStream(zipPath))

  archive.append(JSON.stringify(manifest, null, 2), { name: MANIFEST_ENTRY })
  archive.file(snapshotPath, { name: DB_ENTRY })
  // Images/videos are already compressed, so they are stored as-is.
  for (const name of uploads) {
    // `file()` is typed with EntryData, but the zip plugin also honors `store` there.
    const entry: ZipEntryData = { name: `${UPLOADS_PREFIX}${name}`, store: true }
    archive.file(join(UPLOAD_DIR, name), entry)
  }

  await Promise.all([archive.finalize(), written])

  await unlink(snapshotPath)
  return { dir, zipPath, fileName }
}

async function moveFile(from: string, to: string) {
  try {
    await rename(from, to)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EXDEV') throw error
    await copyFile(from, to)
    await unlink(from)
  }
}

async function savePreRestoreBackup() {
  const { dir, zipPath } = await createBackupFile()
  try {
    await mkdir(PRE_RESTORE_DIR, { recursive: true })
    const target = join(PRE_RESTORE_DIR, `pre-restore-${timestamp()}.zip`)
    await moveFile(zipPath, target)

    const old = (await readdir(PRE_RESTORE_DIR))
      .filter(name => name.startsWith('pre-restore-') && name.endsWith('.zip'))
      .sort()
      .reverse()
      .slice(KEEP_PRE_RESTORE)
    await Promise.all(old.map(name => unlink(join(PRE_RESTORE_DIR, name))))

    return target
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

export interface RestoreResult {
  cards: number
  boards: number
  uploads: number
  missingUploads: number
  migrated: boolean
  preRestoreFile: string
}

/**
 * Streams the uploaded zip to disk, validates it, backs up the current data, then swaps the database and uploads
 * for the zip's content. Nothing is buffered in memory, so the backup size is only limited by disk space.
 */
export async function restoreBackup(upload: Readable): Promise<RestoreResult> {
  if (restoring) throw new BackupError('Já existe uma restauração em andamento')
  restoring = true

  const dbPath = resolveDbPath()
  const workDir = join(DATA_DIR, `.restore-${Date.now()}`)
  const stagedDir = join(workDir, 'staged')

  try {
    await mkdir(workDir, { recursive: true })
    const zipPath = join(workDir, 'upload.zip')
    await pipeline(upload, byteLimit({ total: 0 }, MAX_RESTORE_BYTES), createWriteStream(zipPath))

    const backup = await extractBackupZip(zipPath, stagedDir, MAX_RESTORE_BYTES)
    await unlink(zipPath)
    const stagedDb = join(stagedDir, DB_ENTRY)
    const stagedUploads = join(stagedDir, 'uploads')

    const candidate = new PrismaClient({ datasourceUrl: `file:${stagedDb}` })
    let counts: { cards: number, boards: number, storageKeys: string[] }
    let verdict: ReturnType<typeof checkCompatibility>
    try {
      const inspected = await inspect(candidate).catch(() => {
        throw new BackupError('O arquivo do banco no .zip não é um SQLite válido')
      })
      verdict = checkCompatibility(inspected, await inspect(db))
      if ('error' in verdict) throw new BackupError(verdict.error!)

      const [cards] = await candidate.$queryRawUnsafe<{ n: number }[]>('SELECT COUNT(*) AS n FROM cards')
      const [boards] = await candidate.$queryRawUnsafe<{ n: number }[]>('SELECT COUNT(*) AS n FROM boards')
      const attachments = await candidate.$queryRawUnsafe<{ storage_key: string }[]>('SELECT storage_key FROM attachments')
      counts = {
        cards: Number(cards?.n ?? 0),
        boards: Number(boards?.n ?? 0),
        storageKeys: attachments.map(row => row.storage_key)
      }
    } finally {
      await candidate.$disconnect()
    }

    const preRestoreFile = await savePreRestoreBackup()

    // Point of no return: the live database is replaced. Prisma reconnects lazily on the next query.
    await db.$disconnect()
    await moveFile(stagedDb, dbPath)
    await Promise.all(['-wal', '-shm', '-journal'].map(suffix => rm(`${dbPath}${suffix}`, { force: true })))

    const previousUploads = join(workDir, 'previous-uploads')
    await rename(UPLOAD_DIR, previousUploads).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== 'ENOENT') throw error
    })
    await rename(stagedUploads, UPLOAD_DIR)

    const needsMigration = 'needsMigration' in verdict && verdict.needsMigration
    if (needsMigration) {
      await run('npx', ['prisma', 'migrate', 'deploy'], { cwd: process.cwd() })
    }

    const uploadNames = new Set(backup.uploads)
    return {
      cards: counts.cards,
      boards: counts.boards,
      uploads: backup.uploads.length,
      missingUploads: counts.storageKeys.filter(key => !uploadNames.has(key)).length,
      migrated: needsMigration,
      preRestoreFile: basename(preRestoreFile)
    }
  } finally {
    restoring = false
    await rm(workDir, { recursive: true, force: true })
  }
}
