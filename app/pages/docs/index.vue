<script setup lang="ts">
const npmCode = `npm install
cp .env.example .env
npm run db:deploy
npm run dev`
</script>

<template>
  <div>
    <h1>ClickLocal</h1>
    <p>
      O ClickLocal é um board de tasks local, no estilo Trello/ClickUp: <strong>sem nuvem, sem conta e sem autenticação</strong>.
      Os dados ficam em um arquivo SQLite na sua máquina.
    </p>

    <h2>O que você encontra aqui</h2>
    <ul>
      <li><NuxtLink to="/docs/boards">Uso</NuxtLink>: boards, colunas e cards, editor Markdown com diagramas, controle de tempo e a integração com o Azure DevOps.</li>
      <li><NuxtLink to="/docs/mcp">Integração MCP</NuxtLink>: como deixar agentes de IA (Claude Code, Claude Desktop e outros clientes MCP) consultarem e gerenciarem seu backlog.</li>
    </ul>

    <h2>Primeiros passos</h2>
    <h3>Com npm</h3>
    <p>Requer Node 22 ou superior.</p>
    <DocsCode
      :code="npmCode"
      lang="bash"
    />

    <h3>Com Docker</h3>
    <p>Não precisa instalar Node. Só Docker.</p>
    <DocsCode
      code="docker compose up --build"
      lang="bash"
    />
    <p>
      Nos dois casos o app sobe em <code>http://localhost:8880</code>. Com Docker, os dados ficam em <code>./data</code> no host
      e persistem entre reinícios e rebuilds.
    </p>

    <h2>Visão rápida das funcionalidades</h2>
    <div class="table-wrap">
      <table>
        <thead>
          <tr><th>Área</th><th>O que faz</th></tr>
        </thead>
        <tbody>
          <tr><td>Boards</td><td>Vários boards, modelos de board, colunas com nome e cor, drag-and-drop</td></tr>
          <tr><td>Cards</td><td>Subtarefas, cards filhos, tags, prazo, arquivamento, imagens e vídeos</td></tr>
          <tr><td>Editor</td><td>Markdown com toolbar, diagramas Mermaid e fórmulas KaTeX</td></tr>
          <tr><td>Tempo</td><td>Cronômetro e lançamento manual de horas</td></tr>
          <tr><td>Atividade</td><td>Comentários em Markdown e histórico de mudanças</td></tr>
          <tr><td>Azure DevOps</td><td>Sincroniza seus work items e envia estado, horas e comentários</td></tr>
          <tr><td>MCP</td><td>23 tools para agentes de IA gerenciarem o backlog</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
