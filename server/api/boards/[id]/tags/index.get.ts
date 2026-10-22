import { listTags } from '../../../../services/tags'
import { requireIdParam } from '../../../../utils/params'

export default defineEventHandler((event) => {
  const boardId = requireIdParam(event)
  return listTags(boardId)
})
