import { createWriteStream } from 'node:fs'
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Readable } from 'node:stream'
import { crc32 } from 'node:zlib'
import { pipeline } from 'node:stream/promises'
import { ZipArchive } from 'archiver'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { BackupError, checkCompatibility, classifyEntry, resolveDbPath } from './backup'
import { extractBackupZip } from './backupZip'

/** Minimal STORE-only zip written by hand, so entry names archiver would sanitize (like `../`) can be tested. */
function rawZip(entries: Record<string, string>) {
  const locals: Buffer[] = []
  const centrals: Buffer[] = []
  let offset = 0
  for (const [name, text] of Object.entries(entries)) {
    const nameBuf = Buffer.from(name)
    const data = Buffer.from(text)
    const crc = crc32(data)
    const local = Buffer.alloc(30)
    local.writeUInt32LE(0x04034B50, 0)
    local.writeUInt16LE(20, 4)
    local.writeUInt32LE(crc, 14)
    local.writeUInt32LE(data.length, 18)
    local.writeUInt32LE(data.length, 22)
    local.writeUInt16LE(nameBuf.length, 26)
    const central = Buffer.alloc(46)
    central.writeUInt32LE(0x02014B50, 0)
    central.writeUInt16LE(20, 4)
    central.writeUInt16LE(20, 6)
    central.writeUInt32LE(crc, 16)
    central.writeUInt32LE(data.length, 20)
    central.writeUInt32LE(data.length, 24)
    central.writeUInt16LE(nameBuf.length, 28)
    central.writeUInt32LE(offset, 42)
    locals.push(local, nameBuf, data)
    centrals.push(central, nameBuf)
    offset += 30 + nameBuf.length + data.length
  }
  const centralBuf = Buffer.concat(centrals)
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054B50, 0)
  end.writeUInt16LE(Object.keys(entries).length, 8)
  end.writeUInt16LE(Object.keys(entries).length, 10)
  end.writeUInt32LE(centralBuf.length, 12)
  end.writeUInt32LE(offset, 16)
  return Buffer.concat([...locals, centralBuf, end])
}

const live = { tables: ['boards', 'board_columns', 'cards', 'attachments', 'tags'], migrations: ['a', 'b'] }
const backup = { integrity: 'ok', tables: [...live.tables], migrations: ['a', 'b'] }

describe('classifyEntry', () => {
  it('accepts the known layout', () => {
    expect(classifyEntry('clicklocal.db')).toEqual({ kind: 'db' })
    expect(classifyEntry('manifest.json')).toEqual({ kind: 'manifest' })
    expect(classifyEntry('uploads/abc-1.png')).toEqual({ kind: 'upload', fileName: 'abc-1.png' })
  })

  it.each(['../evil', 'uploads/../evil', 'uploads/a/b.png', '/etc/passwd', 'other.txt', 'uploads/..'])('rejects %s', (name) => {
    expect(() => classifyEntry(name)).toThrow(BackupError)
  })
})

describe('extractBackupZip', () => {
  let dir: string

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'clicklocal-test-'))
  })
  afterEach(() => rm(dir, { recursive: true, force: true }))

  async function makeZip(entries: Record<string, string | Buffer>) {
    const path = join(dir, 'in.zip')
    const archive = new ZipArchive()
    const written = pipeline(archive, createWriteStream(path))
    for (const [name, content] of Object.entries(entries)) archive.append(content, { name })
    await Promise.all([archive.finalize(), written])
    return path
  }

  it('extracts the db and uploads to disk', async () => {
    const zip = await makeZip({ 'clicklocal.db': 'db', 'manifest.json': '{}', 'uploads/a.png': 'img' })
    const result = await extractBackupZip(zip, join(dir, 'out'), 1024)
    expect(result.uploads).toEqual(['a.png'])
    expect(await readFile(join(dir, 'out', 'clicklocal.db'), 'utf8')).toBe('db')
    expect(await readdir(join(dir, 'out', 'uploads'))).toEqual(['a.png'])
  })

  it('rejects non-zip data', async () => {
    const path = join(dir, 'bad.zip')
    await pipeline(Readable.from(['not a zip']), createWriteStream(path))
    await expect(extractBackupZip(path, join(dir, 'out'), 1024)).rejects.toThrow('não é um .zip válido')
  })

  it('rejects a zip without the database', async () => {
    const zip = await makeZip({ 'uploads/a.png': 'img' })
    await expect(extractBackupZip(zip, join(dir, 'out'), 1024)).rejects.toThrow('não contém o banco')
  })

  it('rejects unexpected or unsafe entries', async () => {
    const zip = await makeZip({ 'clicklocal.db': 'db', 'uploads/sub/evil.png': 'x' })
    await expect(extractBackupZip(zip, join(dir, 'out'), 1024)).rejects.toThrow(BackupError)
  })

  it('rejects path traversal entries', async () => {
    const path = join(dir, 'evil.zip')
    await pipeline(Readable.from([rawZip({ 'clicklocal.db': 'db', 'uploads/../../evil': 'x' })]), createWriteStream(path))
    await expect(extractBackupZip(path, join(dir, 'out'), 1024)).rejects.toThrow('caminho inseguro')
  })

  it('rejects content above the size limit', async () => {
    const zip = await makeZip({ 'clicklocal.db': Buffer.alloc(2000, 1) })
    await expect(extractBackupZip(zip, join(dir, 'out'), 1000)).rejects.toThrow('limite de tamanho')
  })
})

describe('checkCompatibility', () => {
  it('accepts an identical backup', () => {
    expect(checkCompatibility(backup, live)).toEqual({ needsMigration: false })
  })

  it('rejects a corrupted database', () => {
    expect(checkCompatibility({ ...backup, integrity: '*** in database main ***' }, live)).toHaveProperty('error')
  })

  it('rejects a database that is not a ClickLocal one', () => {
    expect(checkCompatibility({ ...backup, tables: ['foo'] }, live)).toHaveProperty('error')
  })

  it('rejects a backup from a newer version', () => {
    expect(checkCompatibility({ ...backup, migrations: ['a', 'b', 'c'] }, live)).toHaveProperty('error')
  })

  it('accepts an older backup and asks for migration', () => {
    const older = { ...backup, tables: live.tables.filter(t => t !== 'tags'), migrations: ['a'] }
    expect(checkCompatibility(older, live)).toEqual({ needsMigration: true })
  })

  it('rejects an incomplete backup of the same version', () => {
    expect(checkCompatibility({ ...backup, tables: live.tables.filter(t => t !== 'tags') }, live)).toHaveProperty('error')
  })
})

describe('resolveDbPath', () => {
  it('keeps absolute paths and resolves relative ones against prisma/', () => {
    expect(resolveDbPath('file:/app/data/clicklocal.db')).toBe('/app/data/clicklocal.db')
    expect(resolveDbPath('file:./data/x.db')).toBe(`${process.cwd()}/prisma/data/x.db`)
  })

  it('rejects non-sqlite urls', () => {
    expect(() => resolveDbPath('postgres://x')).toThrow(BackupError)
  })
})
