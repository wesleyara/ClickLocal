import { azureDevOpsRepository } from '../../repositories/azureDevOpsRepository'
import { commentRepository } from '../../repositories/commentRepository'
import { adoWriteGuard, listComments as listAdoComments } from '../../utils/azureDevOps'

export class AlreadyPublishedError extends Error {}

export interface PublishResult {
  dryRun: boolean
  adoCommentId: number | null
}

/** Publishes a local comment as-is to the ADO work item's Discussion, via `adoWriteGuard`. */
export async function publishComment(commentId: number): Promise<PublishResult> {
  const comment = await commentRepository.findById(commentId)
  if (!comment) throw new Error('Comentário não encontrado')
  if (comment.adoCommentId) throw new AlreadyPublishedError('Este comentário já foi publicado no Azure DevOps')

  const linked = await azureDevOpsRepository.findWorkItemByCardId(comment.cardId)
  if (!linked) throw new Error('Card não vinculado ao Azure DevOps')

  const result = await adoWriteGuard({
    cardId: comment.cardId,
    project: linked.project,
    adoId: linked.adoId,
    op: 'addComment',
    eventType: 'ado_comment_published',
    activityPayload: { commentId },
    comment: comment.body
  })

  if (!result.dryRun && result.comment) {
    await commentRepository.update(commentId, { adoCommentId: result.comment.id })
  }

  return { dryRun: result.dryRun, adoCommentId: result.comment?.id ?? null }
}

export interface AdoDiscussionComment {
  id: number
  text: string
  author: string
  createdDate: string
}

/** Reads the ADO work item's Discussion live; never persisted locally. */
export async function listAdoDiscussion(cardId: number): Promise<AdoDiscussionComment[]> {
  const linked = await azureDevOpsRepository.findWorkItemByCardId(cardId)
  if (!linked) return []

  const connection = await azureDevOpsRepository.findConnection()
  if (!connection) return []

  const { comments } = await listAdoComments(connection.orgUrl, connection.pat, linked.project, linked.adoId)
  return comments.map(c => ({ id: c.id, text: c.text, author: c.createdBy.displayName, createdDate: c.createdDate }))
}
