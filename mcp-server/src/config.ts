export const config = {
  apiBaseUrl: (process.env.CLICKLOCAL_API_URL ?? 'http://localhost:8880/api').replace(/\/+$/, '')
}
