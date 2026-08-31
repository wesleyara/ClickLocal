import { db } from '../utils/db'

export default defineEventHandler(async () => {
  const boardCount = await db.board.count()
  return { status: 'ok', boardCount }
})
