import { createWriteStream } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { Transform } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import yauzl from 'yauzl'
import { BackupError, DB_ENTRY, classifyEntry } from './backup'

/** Pass-through that fails once more than `maxBytes` went through it. `total` is shared across streams via the counter. */
export function byteLimit(counter: { total: number }, maxBytes: number) {
  return new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      counter.total += chunk.length
      if (counter.total > maxBytes) {
        return callback(new BackupError('O backup excede o limite de tamanho aceito'))
      }
      callback(null, chunk)
    }
  })
}

const INVALID_ZIP = 'O arquivo enviado não é um .zip válido ou está corrompido'

/**
 * Extracts a backup zip entry by entry, streaming from disk to disk (memory use does not depend on the backup size).
 * Writes `clicklocal.db` and `uploads/<name>` under `destDir`; every entry name is validated first.
 */
export function extractBackupZip(zipPath: string, destDir: string, maxBytes: number) {
  return new Promise<{ uploads: string[] }>((resolve, reject) => {
    yauzl.open(zipPath, { lazyEntries: true, validateEntrySizes: true }, async (openError, zip) => {
      if (openError) return reject(new BackupError(INVALID_ZIP))

      const uploads: string[] = []
      const seen = new Set<string>()
      const counter = { total: 0 }
      let hasDb = false
      let failed = false

      const fail = (error: unknown) => {
        if (failed) return
        failed = true
        zip.close()
        if (error instanceof BackupError) return reject(error)
        // yauzl rejects traversal names itself, before our own entry validation runs.
        const unsafe = /relative path|absolute path/.test((error as Error)?.message ?? '')
        reject(new BackupError(unsafe ? 'O .zip contém uma entrada com caminho inseguro' : INVALID_ZIP))
      }

      try {
        await mkdir(join(destDir, 'uploads'), { recursive: true })
      } catch (error) {
        return fail(error)
      }

      zip.on('error', fail)
      zip.on('end', () => {
        if (failed) return
        if (!hasDb) return fail(new BackupError(`O .zip não contém o banco (${DB_ENTRY})`))
        resolve({ uploads })
      })

      zip.on('entry', (entry: yauzl.Entry) => {
        let target: string | null
        try {
          const kind = classifyEntry(entry.fileName)
          if (seen.has(entry.fileName)) throw new BackupError(`O .zip contém a entrada repetida "${entry.fileName}"`)
          seen.add(entry.fileName)

          if (kind.kind === 'db') {
            hasDb = true
            target = join(destDir, DB_ENTRY)
          } else if (kind.kind === 'upload') {
            uploads.push(kind.fileName)
            target = join(destDir, 'uploads', kind.fileName)
          } else {
            target = null
          }
          if (counter.total + entry.uncompressedSize > maxBytes) {
            throw new BackupError('O conteúdo do backup excede o limite de tamanho aceito')
          }
        } catch (error) {
          return fail(error)
        }

        if (!target) return zip.readEntry()

        zip.openReadStream(entry, (streamError, stream) => {
          if (streamError) return fail(streamError)
          pipeline(stream, byteLimit(counter, maxBytes), createWriteStream(target!)).then(() => zip.readEntry(), fail)
        })
      })

      zip.readEntry()
    })
  })
}
