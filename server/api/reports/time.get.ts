import { getTimeReport } from '../../services/reports'
import { parseId } from '../../utils/params'
import { isReportGroup, parseIdList, parseReportBound, ReportQueryError } from '../../utils/timeReport'

export default defineEventHandler(async (event) => {
  const query = getQuery<Record<string, string | undefined>>(event)

  const groupBy = query.groupBy ?? 'day'
  if (!isReportGroup(groupBy)) {
    throw createError({ statusCode: 400, statusMessage: 'groupBy must be day, board, tag or card' })
  }

  const boardId = query.boardId === undefined ? undefined : parseId(query.boardId)
  if (boardId === null) {
    throw createError({ statusCode: 400, statusMessage: 'invalid boardId' })
  }

  try {
    const from = query.from ? parseReportBound(query.from, 'from') : undefined
    const to = query.to ? parseReportBound(query.to, 'to') : undefined
    const tagIds = parseIdList(query.tagIds)
    return await getTimeReport({ from, to, boardId, tagIds }, groupBy)
  } catch (error) {
    if (error instanceof ReportQueryError) {
      throw createError({ statusCode: 400, statusMessage: error.message })
    }
    throw error
  }
})
