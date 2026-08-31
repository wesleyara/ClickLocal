import { listTags } from '../../../../services/tags'

export default defineEventHandler((event) => {
  const boardId = Number(getRouterParam(event, 'id'))
  return listTags(boardId)
})
