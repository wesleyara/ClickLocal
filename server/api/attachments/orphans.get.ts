import { listOrphanAttachments } from '../../services/orphanAttachments'

export default defineEventHandler(() => listOrphanAttachments())
