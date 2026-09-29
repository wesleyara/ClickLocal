<script setup lang="ts">
const dev = `cd mcp-server
npm run dev        # modo watch via tsx
npm run typecheck  # checagem de tipos
npm run build      # gera dist/index.js`
</script>

<template>
  <div>
    <h1>Segurança e limites</h1>

    <h2>Sem autenticação</h2>
    <p>
      O ClickLocal não tem contas nem chaves de API, e o MCP também não. Quem consegue rodar o servidor MCP e alcançar a API tem
      acesso total aos boards liberados. Use o ClickLocal em <code>localhost</code> ou em rede confiável e não exponha a porta 8880
      na internet.
    </p>

    <h2>O board do Azure DevOps é bloqueado</h2>
    <p>
      O board gerenciado pela <NuxtLink to="/docs/azure-devops">integração com o Azure DevOps</NuxtLink> não é acessível pelo MCP,
      nem para leitura nem para escrita:
    </p>
    <ul>
      <li>ele não aparece em <code>clicklocal_list_boards</code>;</li>
      <li>ler, criar, editar ou mover cards dentro dele retorna erro (<code>AdoBoardBlockedError</code>).</li>
    </ul>
    <p>Isso impede que um agente interfira na sincronização ou em cards ligados a work items reais.</p>

    <h2>Fora do escopo da v1</h2>
    <ul>
      <li>CRUD de boards e colunas</li>
      <li>Gestão da integração com o Azure DevOps</li>
      <li>Anexos</li>
    </ul>

    <h2>Tratamento de erros</h2>
    <ul>
      <li>
        <strong>API fora do ar</strong>: a tool devolve um erro explicando como corrigir (subir o app com <code>npm run dev</code>
        ou ajustar <code>CLICKLOCAL_API_URL</code>), sem derrubar o processo.
      </li>
      <li><strong>Erros da API</strong> (validação, card não encontrado etc.): repassados com a mensagem original.</li>
    </ul>

    <h2>Desenvolvimento do servidor</h2>
    <DocsCode
      :code="dev"
      lang="bash"
    />
  </div>
</template>
