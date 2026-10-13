import { activityLogRepository } from '../repositories/activityLogRepository'
import type { DbClient } from './db'

export type ActivityEventType
  = | 'card_created'
    | 'title_changed'
    | 'description_changed'
    | 'moved_column'
    | 'due_date_changed'
    | 'card_archived'
    | 'card_unarchived'
    | 'subtask_added'
    | 'subtask_completed'
    | 'subtask_reopened'
    | 'subtask_removed'
    | 'tag_added'
    | 'tag_removed'
    | 'comment_added'
    | 'time_entry_added'
    | 'child_card_added'
    | 'ado_synced_changes'
    | 'ado_state_pushed'
    | 'ado_hours_pushed'
    | 'ado_comment_published'

/** Server-only activity log write — never exposed as a client-callable route, so the history stays trustworthy. */
export function logActivity(cardId: number, eventType: ActivityEventType, payload: Record<string, unknown> | undefined, client: DbClient) {
  return activityLogRepository.create(cardId, eventType, payload, client)
}
