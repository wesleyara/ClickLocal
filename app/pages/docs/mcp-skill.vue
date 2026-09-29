<script setup lang="ts">
// § stands in for a backtick so the template can live inside a JS template literal.
const skillTemplate = `---
name: clicklocal-task
description: Executa uma task rastreada no board ClickLocal "<NOME DO BOARD>" (tools clicklocal_*). Use sempre que pedirem para implementar, continuar, checar ou fechar "a task N" ou "o card N". Garante que o card é lido antes de codar e que, ao concluir, é movido para a coluna certa e comentado com o que foi feito.
---

# Executar uma task via ClickLocal

Neste projeto, "task" sem mais contexto se refere a um **card do ClickLocal**.

## 0. Localizar o board

O board de trabalho é **"<NOME DO BOARD>"**. Não assuma o ID: chame
§clicklocal_list_boards§ e confirme pelo nome antes de listar cards. Depois use
§clicklocal_get_board§ para conferir os IDs das colunas, que podem mudar.

| Coluna        | Uso                                             |
| ------------- | ----------------------------------------------- |
| §TO-DO§       | ainda não iniciado                              |
| §Bugs§        | defeitos reportados (sintoma, causa raiz)       |
| §In-progress§ | em andamento: mover para cá ao começar          |
| §Testing§     | implementado, falta validar                     |
| §Done§        | concluído e verificado                          |

## 1. Ler o card

§clicklocal_get_card({ cardId })§ com o ID citado. Se o pedido não trouxer ID,
liste (§clicklocal_list_cards§) e confirme com o usuário qual card.

Leia tudo: título, descrição, subtarefas e comentários (§clicklocal_list_comments§).
Se o escopo estiver solto, defina-o a partir da descrição e do código atual e
registre a decisão no comentário final, não em silêncio.

## 2. Começar

Mova o card para **In-progress** antes de tocar em código:
§clicklocal_update_card({ cardId, columnId: <id de In-progress> })§.

## 3. Implementar

Fique dentro do que o card pede e siga as convenções do projeto. Em card de bug,
investigue a causa raiz antes de corrigir.

## 4. Validar

Rode lint, typecheck e testes do projeto. Depois confira o que o card pede, item
por item, extraindo critérios verificáveis da descrição.

## 5. Fechar

1. **Sempre** mova o card para a coluna correta. Nunca deixe em In-progress:
   - tudo verificado de fato: **Done**;
   - implementado, mas com verificação pendente que este ambiente não consegue
     fazer: **Testing**. Não force Done.
2. **Sempre** comente no card (§clicklocal_add_comment§), inclusive quando a task
   para no meio por um bloqueio. O comentário cobre:
   - o que mudou e por quê (bug: sintoma, causa raiz, correção);
   - arquivos-chave tocados;
   - como foi validado;
   - decisões de escopo tomadas por conta própria;
   - pendências explícitas. Nunca finja que algo foi verificado sem ter sido.
3. Se surgir algo fora do escopo, mencione ao relatar ou crie um card novo
   (§clicklocal_create_card§) em §TO-DO§ ou §Bugs§.

## Card bloqueado

Se o card depende de algo ainda não pronto, pare e diga qual é o bloqueio antes de
implementar pela metade. Registre-o num comentário e deixe o card na coluna em que
faz sentido, não em In-progress.
`.replaceAll('§', '`')

const commentTemplate = `**Sintoma:** a lista de cards não atualizava após mover para outra coluna.
**Causa raiz:** o filtro em cache ignorava o novo columnId.
**Correção:** invalidar o cache ao mover (§app/stores/board.ts§).

**Validação:** lint, typecheck e testes passando; conferido item a item no card.
**Decisões de escopo:** mantive o cache; só corrigi a invalidação.
**Pendências:** verificação visual em dispositivo real.`.replaceAll('§', '`')

const flow = `flowchart LR
  T[TO-DO / Bugs] -->|ler card e mover| P[In-progress]
  P -->|implementar e validar| Q{Verificado de fato?}
  Q -->|sim| D[Done]
  Q -->|falta verificação| X[Testing]
  P -->|bloqueio| B[Comentar e sair de In-progress]
  D --> C[Comentário obrigatório]
  X --> C`
</script>

<template>
  <div>
    <h1>Skill de tasks</h1>
    <p>
      Com o <NuxtLink to="/docs/mcp">MCP</NuxtLink> configurado, o agente já consegue ler e mover cards. O que garante que ele
      faça isso <strong>sempre do mesmo jeito</strong> é uma <strong>skill</strong>: um arquivo de instruções que ensina o
      agente a tratar "a task 12" como o card 12 do ClickLocal, do começo ao fim.
    </p>

    <h2>O que a skill garante</h2>
    <ul>
      <li>O card é <strong>lido por inteiro</strong> (descrição, subtarefas e comentários) antes de qualquer código.</li>
      <li>Ao começar, o card vai para <strong>In-progress</strong>.</li>
      <li>Ao terminar, o card vai para a <strong>coluna certa</strong> e recebe um <strong>comentário obrigatório</strong> com o que foi feito.</li>
      <li>Verificação que o ambiente não consegue fazer vai para <strong>Testing</strong>, nunca para Done.</li>
      <li>Trabalho fora do escopo vira um <strong>card novo</strong>, não uma alteração silenciosa.</li>
    </ul>

    <h2>Fluxo</h2>
    <DocsMermaid :code="flow" />

    <h2>Como instalar</h2>
    <ol>
      <li>Configure o <NuxtLink to="/docs/mcp">servidor MCP</NuxtLink> no projeto.</li>
      <li>
        Crie o arquivo <code>.claude/skills/clicklocal-task/SKILL.md</code> no repositório (ou em <code>~/.claude/skills/</code>
        para valer em todos os projetos) com o modelo abaixo.
      </li>
      <li>Troque <code>&lt;NOME DO BOARD&gt;</code> pelo nome do board do projeto e ajuste os nomes das colunas.</li>
      <li>Peça ao agente: <em>"implemente a task 12"</em>.</li>
    </ol>

    <DocsCallout
      type="tip"
      title="Um board por projeto"
    >
      É comum ter vários boards no mesmo ClickLocal. Por isso a skill manda o agente confirmar o board pelo
      <strong>nome</strong> com <code>clicklocal_list_boards</code> em vez de assumir um ID.
    </DocsCallout>

    <h2>Modelo de SKILL.md</h2>
    <DocsCode
      :code="skillTemplate"
      lang="markdown"
    />

    <h2>Tools usadas</h2>
    <div class="table-wrap">
      <table>
        <thead>
          <tr><th>Passo</th><th>Tools</th></tr>
        </thead>
        <tbody>
          <tr><td>Localizar board e colunas</td><td><code>clicklocal_list_boards</code>, <code>clicklocal_get_board</code></td></tr>
          <tr><td>Ler o card</td><td><code>clicklocal_get_card</code>, <code>clicklocal_list_cards</code>, <code>clicklocal_list_comments</code></td></tr>
          <tr><td>Começar e fechar</td><td><code>clicklocal_update_card</code> (com <code>columnId</code>)</td></tr>
          <tr><td>Registrar o que foi feito</td><td><code>clicklocal_add_comment</code></td></tr>
          <tr><td>Trabalho fora do escopo</td><td><code>clicklocal_create_card</code></td></tr>
        </tbody>
      </table>
    </div>

    <h2>Exemplo de comentário de fechamento</h2>
    <p>O comentário é Markdown e deve permitir que outra pessoa entenda o que aconteceu sem abrir o código:</p>
    <DocsCode
      :code="commentTemplate"
      lang="markdown"
    />

    <h2>Adaptando ao seu projeto</h2>
    <ul>
      <li>
        <strong>Colunas diferentes:</strong> a skill depende dos nomes das colunas. Se o seu board usa outras, troque na tabela
        do passo 0 e nos passos que citam In-progress, Testing e Done.
      </li>
      <li>
        <strong>Backlog em arquivos:</strong> se os cards espelham tarefas de um backlog em Markdown no repositório, acrescente um
        passo mandando abrir esse arquivo e fechá-lo também. Mover o card não substitui isso.
      </li>
      <li>
        <strong>Comandos de validação:</strong> troque lint, typecheck e testes pelos comandos reais do projeto.
      </li>
      <li>
        <strong>Board do Azure DevOps:</strong> ele é <NuxtLink to="/docs/mcp-seguranca">bloqueado no MCP</NuxtLink>, então a skill
        só funciona em boards locais.
      </li>
    </ul>
  </div>
</template>
