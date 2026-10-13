import { config } from './config.js'

export class ClickLocalUnreachableError extends Error {}

export class ClickLocalApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

export async function apiFetch<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const url = `${config.apiBaseUrl}${path}`

  let res: Response
  try {
    res = await fetch(url, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers }
    })
  } catch {
    throw new ClickLocalUnreachableError(
      `Não foi possível conectar à API do ClickLocal em ${url}. Verifique se o app está rodando ` +
      '(`npm run dev` na raiz do ClickLocal) ou ajuste a variável de ambiente CLICKLOCAL_API_URL.'
    )
  }

  if (res.status === 204) return undefined as T

  const text = await res.text()
  const body = text ? JSON.parse(text) : undefined

  if (!res.ok) {
    const message = body?.statusMessage ?? body?.message ?? `Erro HTTP ${res.status} ao chamar ${url}`
    throw new ClickLocalApiError(res.status, message)
  }

  return body as T
}
