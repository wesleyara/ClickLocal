import { tagRepository } from '../repositories/tagRepository'
import { logActivity } from '../utils/activity'
import { db } from '../utils/db'

export function listTags(boardId: number) {
  return tagRepository.findByBoardId(boardId)
}

export function createTag(boardId: number, input: { name: string, color: string }) {
  return tagRepository.create({
    name: input.name.trim(),
    color: input.color,
    board: { connect: { id: boardId } }
  })
}

export function updateTag(id: number, input: { name?: string, color?: string }) {
  return tagRepository.update(id, input)
}

export async function deleteTag(id: number) {
  await tagRepository.delete(id)
}

export async function attachTag(cardId: number, tagId: number) {
  const tag = await tagRepository.findById(tagId)

  await db.$transaction(async (tx) => {
    await tagRepository.attachToCard(cardId, tagId, tx)
    await logActivity(cardId, 'tag_added', { tagName: tag?.name }, tx)
  })
}

export async function detachTag(cardId: number, tagId: number) {
  const tag = await tagRepository.findById(tagId)

  await db.$transaction(async (tx) => {
    await tagRepository.detachFromCard(cardId, tagId, tx)
    await logActivity(cardId, 'tag_removed', { tagName: tag?.name }, tx)
  })
}
