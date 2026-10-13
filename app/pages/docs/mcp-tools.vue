<script setup lang="ts">
const createCard = `{
  "name": "clicklocal_create_card",
  "arguments": { "columnId": 3, "title": "Revisar contrato", "description": "- [ ] Ler cláusulas" }
}`
const moveCard = `{
  "name": "clicklocal_update_card",
  "arguments": { "cardId": 42, "columnId": 5 }
}`
const logTime = `{
  "name": "clicklocal_log_time_entry",
  "arguments": {
    "cardId": 42,
    "startedAt": "2026-09-28T14:00:00.000Z",
    "durationMs": 1800000,
    "note": "Revisão inicial"
  }
}`
</script>

<template>
  <div>
    <h1>Referência das tools</h1>
    <p>
      Todas as tools têm o prefixo <code>clicklocal_</code> e devolvem JSON como texto. IDs são inteiros positivos. Os
      parâmetros com <code>?</code> são opcionais.
    </p>

    <template
      v-for="group in mcpToolGroups"
      :key="group.title"
    >
      <h2>{{ group.title }}</h2>
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>Tool</th><th>Parâmetros</th><th>Descrição</th></tr>
          </thead>
          <tbody>
            <tr
              v-for="tool in group.tools"
              :key="tool.name"
            >
              <td><code>{{ tool.name }}</code></td>
              <td>{{ tool.params }}</td>
              <td>{{ tool.description }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <DocsCallout
      type="info"
      title="Por que cardId em editar/excluir sub-recursos?"
    >
      <code>update_subtask</code>, <code>delete_subtask</code>, <code>update_comment</code>, <code>delete_comment</code> e
      <code>delete_time_entry</code> exigem <code>cardId</code> mesmo que a API não precise dele. Ele é usado só para verificar
      que o card não pertence ao board do Azure DevOps.
    </DocsCallout>

    <h2>Exemplos de chamada</h2>
    <h3>Criar um card</h3>
    <DocsCode
      :code="createCard"
      lang="json"
    />
    <h3>Mover um card de coluna</h3>
    <DocsCode
      :code="moveCard"
      lang="json"
    />
    <h3>Registrar 30 minutos</h3>
    <DocsCode
      :code="logTime"
      lang="json"
    />
  </div>
</template>
