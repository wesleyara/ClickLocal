export class AdoBoardBlockedError extends Error {
  constructor() {
    super('Este board é gerenciado pela integração com Azure DevOps e não é acessível via MCP.')
  }
}

export function toToolError(err: unknown) {
  const message = err instanceof Error ? err.message : String(err)
  return {
    isError: true as const,
    content: [{ type: 'text' as const, text: message }]
  }
}
