export interface DocsNavItem {
  label: string
  to: string
  icon: string
}

export interface DocsNavGroup {
  title: string
  items: DocsNavItem[]
}

export const docsNav: DocsNavGroup[] = [
  {
    title: 'Começando',
    items: [
      { label: 'Visão geral', to: '/docs', icon: 'i-lucide-house' }
    ]
  },
  {
    title: 'Uso',
    items: [
      { label: 'Boards, colunas e cards', to: '/docs/boards', icon: 'i-lucide-layout-dashboard' },
      { label: 'Editor Markdown e Mermaid', to: '/docs/editor', icon: 'i-lucide-file-pen' },
      { label: 'Tempo e atividade', to: '/docs/tempo-atividade', icon: 'i-lucide-timer' },
      { label: 'Azure DevOps', to: '/docs/azure-devops', icon: 'i-lucide-plug-zap' }
    ]
  },
  {
    title: 'Integração MCP',
    items: [
      { label: 'Guia rápido', to: '/docs/mcp', icon: 'i-lucide-bot' },
      { label: 'Referência das tools', to: '/docs/mcp-tools', icon: 'i-lucide-wrench' },
      { label: 'Skill de tasks', to: '/docs/mcp-skill', icon: 'i-lucide-workflow' },
      { label: 'Segurança e limites', to: '/docs/mcp-seguranca', icon: 'i-lucide-shield-check' }
    ]
  }
]
