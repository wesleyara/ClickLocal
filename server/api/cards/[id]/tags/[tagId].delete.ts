import { detachTag } from '../../../../services/tags'

export default defineEventHandler(async (event) => {
  const cardId = Number(getRouterParam(event, 'id'))
  const tagId = Number(getRouterParam(event, 'tagId'))

  await detachTag(cardId, tagId)
  return { success: true }
})
