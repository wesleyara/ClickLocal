<script setup lang="ts">
const arch = `flowchart LR
  A[Agente / cliente MCP] -->|stdio| M[clicklocal-mcp]
  M -->|HTTP| API[API do ClickLocal :8880]
  API --> DB[(SQLite)]
  M -. bloqueia .-> ADO[Board do Azure DevOps]`

const build = `cd mcp-server
npm install
npm run build`

const config = `{
  "mcpServers": {
    "clicklocal": {
      "command": "node",
      "args": ["/caminho/absoluto/para/ClickLocal/mcp-server/dist/index.js"],
      "env": { "CLICKLOCAL_API_URL": "http://localhost:8880/api" }
    }
  }
}`
</script>

<template>
  <div>
    <h1>Integração MCP</h1>
    <p>
      O ClickLocal tem um servidor <strong>MCP</strong> (Model Context Protocol) que expõe boards, cards, subtarefas, tags,
      comentários e horas como <strong>23 tools</strong>. Qualquer cliente MCP (Claude Code, Claude Desktop e outros) pode usá-las
      para consultar e gerenciar o backlog.
    </p>

    <h2>Como funciona</h2>
    <p>
      O servidor <strong>não acessa o banco de dados</strong>. Ele chama a API HTTP do próprio ClickLocal, reaproveitando toda a
      validação e as regras de negócio.
    </p>
    <DocsMermaid :code="arch" />

    <h2>Pré-requisitos</h2>
    <ul>
      <li>ClickLocal rodando (<code>npm run dev</code> ou Docker), por padrão em <code>http://localhost:8880</code>.</li>
      <li>Node 22 ou superior.</li>
    </ul>

    <h2>Instalação</h2>
    <DocsCode
      :code="build"
      lang="bash"
    />
    <p>
      Isso gera <code>mcp-server/dist/index.js</code>, um executável Node único que fala MCP via <strong>stdio</strong>.
    </p>

    <h2>Configuração do cliente</h2>
    <h3>Claude Code</h3>
    <p>Adicione ao <code>.mcp.json</code> do projeto que vai usar o ClickLocal:</p>
    <DocsCode
      :code="config"
      lang="json"
    />
    <h3>Claude Desktop</h3>
    <p>Use o mesmo bloco em <code>claude_desktop_config.json</code>.</p>
    <h3>Outros clientes</h3>
    <p>
      Qualquer cliente que suporte servidores MCP via stdio serve: o comando é <code>node</code> e o argumento é o caminho de
      <code>dist/index.js</code>. Ajuste o caminho absoluto conforme onde o repositório está clonado.
    </p>

    <h2>Variáveis de ambiente</h2>
    <div class="table-wrap">
      <table>
        <thead>
          <tr><th>Variável</th><th>Padrão</th><th>Descrição</th></tr>
        </thead>
        <tbody>
          <tr><td><code>CLICKLOCAL_API_URL</code></td><td><code>http://localhost:8880/api</code></td><td>URL base da API do ClickLocal</td></tr>
        </tbody>
      </table>
    </div>
    <p>Não há autenticação, pois o ClickLocal não tem contas nem chaves de API.</p>

    <h2>Exemplo de uso</h2>
    <p>Depois de configurado, peça ao agente algo como:</p>
    <blockquote class="my-4 border-l-4 border-primary pl-4 italic">
      Liste meus boards, crie um card "Revisar contrato" na coluna "A fazer" do primeiro board e registre 30 minutos nele.
    </blockquote>
    <p>
      O agente encadeia <code>clicklocal_list_boards</code>, <code>clicklocal_get_board</code>, <code>clicklocal_create_card</code>
      e <code>clicklocal_log_time_entry</code>.
    </p>
    <p>
      Próximos passos: <NuxtLink to="/docs/mcp-tools">referência das tools</NuxtLink>,
      <NuxtLink to="/docs/mcp-skill">skill para executar tasks pelo board</NuxtLink> e
      <NuxtLink to="/docs/mcp-seguranca">segurança e limites</NuxtLink>.
    </p>
  </div>
</template>
