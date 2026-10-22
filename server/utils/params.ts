import type { H3Event } from 'h3'

/** Parses a strictly positive integer id; anything else is null. */
export function parseId(raw: string | undefined): number | null {
  if (!raw || !/^\d+$/.test(raw)) return null
  const id = Number(raw)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

/** Route id param or a 400, so malformed ids never reach Prisma as NaN. */
export function requireIdParam(event: H3Event, name = 'id'): number {
  const id = parseId(getRouterParam(event, name))
  if (id === null) {
    throw createError({ statusCode: 400, statusMessage: `invalid ${name}` })
  }
  return id
}
