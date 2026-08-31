import type { Prisma } from '@prisma/client'
import { PrismaClient } from '@prisma/client'

declare global {

  var __clickLocalPrisma: PrismaClient | undefined
}

export const db = globalThis.__clickLocalPrisma ?? new PrismaClient()

if (import.meta.dev) {
  globalThis.__clickLocalPrisma = db
}

/** A plain PrismaClient or a `$transaction` callback's client — repositories accept either so services can wrap a mutation + its activity log entry atomically. */
export type DbClient = PrismaClient | Prisma.TransactionClient
