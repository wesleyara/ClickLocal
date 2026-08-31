import { commentRepository } from '../repositories/commentRepository'
import { logActivity } from '../utils/activity'
import { db } from '../utils/db'

export function listComments(cardId: number) {
  return commentRepository.findByCardId(cardId)
}

export function createComment(cardId: number, input: { body: string }) {
  return db.$transaction(async (tx) => {
    const comment = await commentRepository.create({
      body: input.body,
      card: { connect: { id: cardId } }
    }, tx)
    await logActivity(cardId, 'comment_added', undefined, tx)
    return comment
  })
}

export function updateComment(id: number, input: { body: string }) {
  return commentRepository.update(id, { body: input.body })
}

export async function deleteComment(id: number) {
  await commentRepository.delete(id)
}
