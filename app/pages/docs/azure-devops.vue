<script setup lang="ts">
const syncDiagram = `flowchart LR
  ADO[Azure DevOps] -->|Sincronizar| S[Sync do ClickLocal]
  S --> C[Cards no board Meu trabalho]
  S -->|saiu do escopo| A[Card arquivado]`
</script>

<template>
  <div>
    <h1>Azure DevOps</h1>
    <p>
      A integração traz para o ClickLocal os work items atribuídos a você e, se você permitir, envia de volta
      <strong>estado</strong>, <strong>horas</strong> e <strong>comentários</strong>. Por padrão ela é <strong>somente leitura</strong>.
    </p>

    <h2>Configuração</h2>
    <p>Acesse <NuxtLink to="/settings/azure-devops">Azure DevOps</NuxtLink> no header:</p>
    <ol>
      <li>Informe a URL da organização e um <strong>PAT</strong> (personal access token).</li>
      <li>Clique em <strong>testar conexão</strong>.</li>
      <li>Salve.</li>
    </ol>
    <p>
      O PAT fica salvo no SQLite local e nunca é devolvido ao navegador. No primeiro salvamento, o ClickLocal cria o board
      <strong>Meu trabalho</strong> com quatro colunas, uma para cada categoria de estado do ADO: Proposed, InProgress, Resolved e Completed.
    </p>

    <h2>Sincronização</h2>
    <p>
      A sincronização é <strong>manual</strong>: use o botão <strong>Sincronizar</strong>. Ela busca os work items atribuídos a
      você (<code>@Me</code>) em todos os projetos.
    </p>
    <DocsMermaid :code="syncDiagram" />
    <p>Cards que saem do seu escopo são arquivados. O resultado da sincronização aparece em uma notificação.</p>

    <h2>Cards vinculados</h2>
    <p>
      Um card vinculado mostra um selo com tipo, <code>#id</code>, estado e projeto, o caminho até o item pai e o botão
      <strong>Abrir no ADO</strong>.
    </p>
    <ul>
      <li>Título e descrição são <strong>somente leitura</strong> (a descrição é sanitizada).</li>
      <li>Não é possível <strong>excluir</strong> um card vinculado; só arquivar.</li>
    </ul>
    <DocsCallout
      type="warning"
      title="Limitação conhecida"
    >
      Imagens embutidas na descrição do work item aparecem quebradas, porque exigem autenticação no Azure DevOps.
    </DocsCallout>

    <h2>Escrevendo de volta no ADO</h2>
    <p>Há três pontos de escrita, todos opcionais:</p>
    <div class="table-wrap">
      <table>
        <thead>
          <tr><th>O quê</th><th>Como</th></tr>
        </thead>
        <tbody>
          <tr><td>Estado</td><td>Ao mover um card para uma coluna mapeada, o app pede confirmação e atualiza o estado. Se o ADO recusar, o card volta</td></tr>
          <tr><td>Horas</td><td><strong>Enviar horas</strong> manda registros em lote para <code>Completed Work</code>; os enviados ficam travados</td></tr>
          <tr><td>Comentários</td><td><strong>Publicar no ADO</strong> publica um comentário local. A aba <em>Discussion (ADO)</em> é só leitura</td></tr>
        </tbody>
      </table>
    </div>

    <h3>Modos de escrita</h3>
    <div class="table-wrap">
      <table>
        <thead>
          <tr><th>Modo</th><th>Efeito</th></tr>
        </thead>
        <tbody>
          <tr><td><strong>Somente leitura</strong> (padrão)</td><td>Nada é escrito no ADO</td></tr>
          <tr><td><strong>Dry-run</strong></td><td>Simula as escritas, sem gravar</td></tr>
          <tr><td><strong>Escrita</strong></td><td>Grava de verdade, apenas nos projetos da lista de permitidos</td></tr>
        </tbody>
      </table>
    </div>
    <p>
      Toda escrita passa por uma única guarda que só aceita os campos <code>System.State</code> e <code>CompletedWork</code>,
      exige projeto permitido, verifica conflito de revisão e registra a operação no histórico do card.
    </p>
    <DocsCallout
      type="tip"
      title="Agentes de IA"
    >
      O board do Azure DevOps <strong>não</strong> é acessível via <NuxtLink to="/docs/mcp-seguranca">MCP</NuxtLink>.
    </DocsCallout>
  </div>
</template>
