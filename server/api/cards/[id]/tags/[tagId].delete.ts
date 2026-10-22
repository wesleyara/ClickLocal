import { detachTag } from '../../../../services/tags'
import { requireIdParam } from '../../../../utils/params'

export default defineEventHandler(async (event) => {
  const cardId = requireIdParam(event)
  const tagId = requireIdParam(event, 'tagId')

  await detachTag(cardId, tagId)
  return { success: true }
})
