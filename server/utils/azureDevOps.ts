import type { ActivityEventType } from './activity'
import type { DbClient } from './db'
import { createError } from 'h3'
import { $fetch } from 'ofetch'
import { azureDevOpsRepository } from '../repositories/azureDevOpsRepository'
import { logActivity } from './activity'
import { db } from './db'

const API_VERSION = '7.1'
const MAX_RETRIES = 3

export interface AdoJsonPatchOperation {
  op: 'add' | 'replace' | 'remove' | 'test'
  path: string
  value?: unknown
}

export interface AdoWorkItemFieldSet {
  'System.Id': number
  'System.Title': string
  'System.WorkItemType': string
  'System.State': string
  'System.TeamProject': string
  'System.AssignedTo'?: { displayName: string, uniqueName: string }
  'System.Description'?: string
  'System.Parent'?: number
  'Microsoft.VSTS.Scheduling.CompletedWork'?: number
  [field: string]: unknown
}

export interface AdoWorkItem {
  id: number
  rev: number
  fields: AdoWorkItemFieldSet
  url: string
}

export interface AdoWorkItemState {
  name: string
  category: string
  order: number
}

export interface AdoWorkItemField {
  referenceName: string
  name: string
  alwaysRequired: boolean
}

export interface AdoComment {
  id: number
  text: string
  createdBy: { displayName: string }
  createdDate: string
}

function buildUrl(orgUrl: string, path: string, apiVersion = API_VERSION, extraParams?: Record<string, string>) {
  const base = orgUrl.replace(/\/+$/, '')
  const url = new URL(`${base}${path}`)
  url.searchParams.set('api-version', apiVersion)
  for (const [key, value] of Object.entries(extraParams ?? {})) {
    url.searchParams.set(key, value)
  }
  return url.toString()
}

function authHeader(pat: string) {
  return `Basic ${Buffer.from(`:${pat}`).toString('base64')}`
}

async function adoRequest<T>(orgUrl: string, pat: string, path: string, options: {
  method?: 'GET' | 'POST' | 'PATCH'
  body?: Record<string, unknown> | unknown[]
  contentType?: string
  apiVersion?: string
  extraParams?: Record<string, string>
} = {}): Promise<T> {
  const url = buildUrl(orgUrl, path, options.apiVersion, options.extraParams)

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await $fetch<T>(url, {
        method: options.method ?? 'GET',
        headers: {
          'Authorization': authHeader(pat),
          'Content-Type': options.contentType ?? 'application/json'
        },
        body: options.body
      })
    } catch (error: unknown) {
      const status = (error as { statusCode?: number, response?: { status?: number } })?.statusCode
        ?? (error as { response?: { status?: number } })?.response?.status

      if (status === 429 && attempt < MAX_RETRIES) {
        const retryAfterHeader = (error as { response?: { headers?: Headers } })?.response?.headers?.get?.('Retry-After')
        const retryAfterSeconds = retryAfterHeader ? Number(retryAfterHeader) : 1
        await new Promise(resolve => setTimeout(resolve, (Number.isFinite(retryAfterSeconds) ? retryAfterSeconds : 1) * 1000))
        continue
      }

      throw toReadableError(error, status)
    }
  }

  throw new Error('Azure DevOps: número máximo de tentativas excedido (429)')
}

function toReadableError(error: unknown, status?: number): Error {
  const message = (error as { data?: { message?: string } })?.data?.message
    ?? (error as { message?: string })?.message
    ?? 'Erro desconhecido ao falar com o Azure DevOps'

  if (status === 401 || status === 203) {
    return new Error('Azure DevOps: PAT inválido ou expirado')
  }
  if (status === 404) {
    return new Error('Azure DevOps: recurso não encontrado (URL da organização ou item incorretos)')
  }
  return new Error(`Azure DevOps: ${message}`)
}

/** Confirms the PAT works and returns the authenticated user's display name. */
export async function connectionData(orgUrl: string, pat: string) {
  const result = await adoRequest<{ authenticatedUser: { providerDisplayName: string, properties?: { Account?: { $value?: string } } } }>(
    orgUrl,
    pat,
    '/_apis/connectionData',
    { apiVersion: '7.1-preview.1' }
  )
  return { userName: result.authenticatedUser.providerDisplayName }
}

export function listProjects(orgUrl: string, pat: string) {
  return adoRequest<{ value: { id: string, name: string }[] }>(orgUrl, pat, '/_apis/projects')
}

export function wiql(orgUrl: string, pat: string, query: string) {
  return adoRequest<{ workItems: { id: number, url: string }[] }>(orgUrl, pat, '/_apis/wit/wiql', {
    method: 'POST',
    body: { query }
  })
}

export function getWorkItemsBatch(orgUrl: string, pat: string, ids: number[], fields: string[]) {
  if (ids.length === 0) return Promise.resolve({ count: 0, value: [] as AdoWorkItem[] })
  return adoRequest<{ count: number, value: AdoWorkItem[] }>(orgUrl, pat, '/_apis/wit/workitemsbatch', {
    method: 'POST',
    body: { ids, fields }
  })
}

export function getWorkItemTypeStates(orgUrl: string, pat: string, project: string, type: string) {
  return adoRequest<{ value: AdoWorkItemState[] }>(
    orgUrl,
    pat,
    `/${encodeURIComponent(project)}/_apis/wit/workitemtypes/${encodeURIComponent(type)}/states`
  )
}

export function getWorkItemTypeFields(orgUrl: string, pat: string, project: string, type: string) {
  return adoRequest<{ value: AdoWorkItemField[] }>(
    orgUrl,
    pat,
    `/${encodeURIComponent(project)}/_apis/wit/workitemtypes/${encodeURIComponent(type)}/fields`
  )
}

/** Not exported: writes must go through `adoWriteGuard`. */
function rawPatchWorkItem(orgUrl: string, pat: string, adoId: number, patch: AdoJsonPatchOperation[]) {
  return adoRequest<AdoWorkItem>(orgUrl, pat, `/_apis/wit/workitems/${adoId}`, {
    method: 'PATCH',
    body: patch,
    contentType: 'application/json-patch+json'
  })
}

export function listComments(orgUrl: string, pat: string, project: string, adoId: number) {
  return adoRequest<{ comments: AdoComment[] }>(
    orgUrl,
    pat,
    `/${encodeURIComponent(project)}/_apis/wit/workItems/${adoId}/comments`,
    { apiVersion: '7.1-preview.4' }
  )
}

/** Not exported: writes must go through `adoWriteGuard`. */
function rawAddComment(orgUrl: string, pat: string, project: string, adoId: number, text: string) {
  return adoRequest<AdoComment>(
    orgUrl,
    pat,
    `/${encodeURIComponent(project)}/_apis/wit/workItems/${adoId}/comments`,
    {
      method: 'POST',
      body: { text },
      apiVersion: '7.1-preview.4',
      extraParams: { format: 'markdown' }
    }
  )
}

const WRITABLE_FIELDS = new Set(['System.State', 'Microsoft.VSTS.Scheduling.CompletedWork'])
export type AdoWriteOp = 'patchWorkItem' | 'addComment'

export interface AdoWriteGuardParams {
  cardId: number
  project: string
  adoId: number
  op: AdoWriteOp
  eventType: ActivityEventType
  activityPayload: Record<string, unknown>
  /** patchWorkItem only */
  fields?: string[]
  rev?: number
  patch?: AdoJsonPatchOperation[]
  /** addComment only */
  comment?: string
}

export interface AdoWriteResult {
  dryRun: boolean
  patch?: AdoJsonPatchOperation[]
  workItem?: AdoWorkItem
  comment?: AdoComment
}

function forbidden(message: string): never {
  throw createError({ statusCode: 403, statusMessage: message })
}

/**
 * The only path to a real write against Azure DevOps. Enforces write mode,
 * the project allowlist, the field allowlist and the operation allowlist
 * before ever calling the ADO API, and audits every write (or dry-run) to
 * the card's activity log.
 */
export async function adoWriteGuard(params: AdoWriteGuardParams, client: DbClient = db): Promise<AdoWriteResult> {
  const connection = await azureDevOpsRepository.findConnection()
  if (!connection) forbidden('Nenhuma conexão com o Azure DevOps configurada')

  if (connection.writeMode !== 'dry-run' && connection.writeMode !== 'write') {
    forbidden('Escrita desabilitada: a conexão está em modo Somente leitura')
  }

  const allowedProjects: string[] = JSON.parse(connection.writeAllowedProjects)
  if (!allowedProjects.includes(params.project)) {
    forbidden(`Escrita não permitida no projeto "${params.project}"`)
  }

  if (params.op !== 'patchWorkItem' && params.op !== 'addComment') {
    forbidden(`Operação "${params.op}" não é permitida`)
  }

  if (params.op === 'patchWorkItem') {
    const fields = params.fields ?? []
    const disallowed = fields.filter(field => !WRITABLE_FIELDS.has(field))
    if (disallowed.length > 0) {
      forbidden(`Campo(s) não permitido(s): ${disallowed.join(', ')}`)
    }
    if (params.rev === undefined || !params.patch) {
      forbidden('rev e patch são obrigatórios para patchWorkItem')
    }
  }

  if (params.op === 'addComment' && !params.comment) {
    forbidden('comment é obrigatório para addComment')
  }

  if (connection.writeMode === 'dry-run') {
    await logActivity(params.cardId, params.eventType, { ...params.activityPayload, dryRun: true }, client)
    return { dryRun: true, patch: params.patch }
  }

  if (params.op === 'patchWorkItem') {
    const patchWithRevCheck: AdoJsonPatchOperation[] = [
      { op: 'test', path: '/rev', value: params.rev },
      ...params.patch!
    ]
    const workItem = await rawPatchWorkItem(connection.orgUrl, connection.pat, params.adoId, patchWithRevCheck)
    await logActivity(params.cardId, params.eventType, { ...params.activityPayload, rev: workItem.rev }, client)
    return { dryRun: false, workItem }
  }

  const comment = await rawAddComment(connection.orgUrl, connection.pat, params.project, params.adoId, params.comment!)
  await logActivity(params.cardId, params.eventType, { ...params.activityPayload, adoCommentId: comment.id }, client)
  return { dryRun: false, comment }
}
