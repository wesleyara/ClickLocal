<script setup lang="ts">
// § stands in for a backtick so the template can live inside a JS template literal.
const skillTemplate = `---
name: clicklocal-task
description: Executa uma task rastreada no board ClickLocal "<NOME DO BOARD>" (tools clicklocal_*). Use sempre que o pedido citar "task", "tarefa", "card" ou um número de item (ex.: "faça a 506"), ou pedir para implementar, corrigir, continuar, checar ou fechar algo rastreado no board. Obrigatório: o card reflete o andamento do trabalho do começo ao fim (coluna, se o board tiver uma adequada, e comentário). Uma task sem o card atualizado NÃO está concluída.
---

# Executar uma task via ClickLocal

Neste projeto, "task" sem mais contexto se refere a um **card do ClickLocal**.

## Regras inegociáveis

O card é o registro oficial do trabalho. Estas regras valem mesmo que a tarefa seja
pequena, que o usuário não as mencione ou que você esteja com pressa:

1. **Antes de editar qualquer arquivo**, sinalize no card que o trabalho começou:
   mova-o para a coluna de andamento, se o board tiver uma.
2. **Antes de encerrar o turno**, o card precisa refletir o estado atual: na coluna
   que corresponde ao resultado, se existir, **e** com um comentário novo
   descrevendo o que foi feito.
3. **Nunca diga "pronto", "concluído" ou equivalente** ao usuário sem ter feito o
   passo 5 (Fechar) e conferido o resultado. Se o passo 5 não aconteceu, a task
   não terminou.
4. Se a tarefa for interrompida, falhar ou ficar bloqueada, o card **também** é
   atualizado (comentário + coluna). Parar em silêncio não é opção.

## 0. Localizar o board

O board de trabalho é **"<NOME DO BOARD>"**. Não assuma o ID: chame
§clicklocal_list_boards§ e confirme pelo nome antes de listar cards. Depois use
§clicklocal_get_board§ para conferir os IDs das colunas, que podem mudar.

Cada board tem suas próprias colunas, e nem todo board tem as mesmas. Identifique
quais representam **não iniciado**, **em andamento**, **em validação** e
**concluído** (por exemplo §TO-DO§, §In-progress§, §Testing§, §Done§ ou equivalentes
como "Fazendo" e "Revisão"). Use as que existirem; **se o board não tiver uma coluna
adequada para o estado, não force nem crie colunas**: registre o estado em
comentário.

## 1. Ler o card

§clicklocal_get_card({ cardId })§ com o ID citado. Se o pedido não trouxer ID,
liste (§clicklocal_list_cards§) e confirme com o usuário qual card.

Leia tudo: título, descrição, subtarefas e comentários (§clicklocal_list_comments§).
Se o escopo estiver solto, defina-o a partir da descrição e do código atual e
registre a decisão no comentário final, não em silêncio.

## 2. Começar

Antes de tocar em código, atualize o card para mostrar que o trabalho começou:

- se houver coluna de andamento, mova-o para ela:
  §clicklocal_update_card({ cardId, columnId: <id da coluna de andamento> })§, e
  confira que o §columnId§ mudou de fato (se falhou, repita);
- se não houver, ou se o card já estiver nela, adicione um comentário curto
  (§clicklocal_add_comment§) dizendo que o trabalho começou e qual é o plano.

## 3. Implementar

Fique dentro do que o card pede e siga as convenções do projeto. Em card de bug,
investigue a causa raiz antes de corrigir.

Em trabalho longo, registre o andamento com §clicklocal_add_comment§ a cada marco
relevante (decisão tomada, bloqueio, parte entregue), para que o card reflita o
estado atual do código mesmo que a sessão seja interrompida.

## 4. Validar

Rode lint, typecheck e testes do projeto. Depois confira o que o card pede, item
por item, extraindo critérios verificáveis da descrição.

## 5. Fechar

1. **Sempre** deixe o card na coluna que corresponde ao resultado, se o board tiver
   uma. Nunca o deixe como "em andamento" ao terminar:
   - tudo verificado de fato: coluna de concluído (ex.: **Done**);
   - implementado, mas com verificação pendente que este ambiente não consegue
     fazer: coluna de validação (ex.: **Testing**), se existir. Não force concluído.
   - sem coluna equivalente: deixe onde está e deixe o estado claro no comentário.
2. **Sempre** comente no card (§clicklocal_add_comment§), inclusive quando a task
   para no meio por um bloqueio. O comentário cobre:
   - o que mudou e por quê (bug: sintoma, causa raiz, correção);
   - arquivos-chave tocados;
   - como foi validado;
   - decisões de escopo tomadas por conta própria;
   - pendências explícitas. Nunca finja que algo foi verificado sem ter sido.
3. Se surgir algo fora do escopo, mencione ao relatar ou crie um card novo
   (§clicklocal_create_card§) na coluna de backlog ou de bugs, se existir.
4. **Confira o resultado**: chame §clicklocal_get_card§ e verifique que a coluna é a
   esperada e que o comentário aparece. Só então responda ao usuário.

### Checklist antes de responder

- [ ] O card foi para a coluna do resultado (quando o board tem uma) ou o estado ficou claro no comentário?
- [ ] Existe um comentário novo no card com mudanças, validação e pendências?
- [ ] Conferi com §clicklocal_get_card§ depois de atualizar?

Se algum item estiver sem marcar, faça-o agora, antes da resposta final.

## Card bloqueado

Se o card depende de algo ainda não pronto, pare e diga qual é o bloqueio antes de
implementar pela metade. Registre-o num comentário e deixe o card na coluna em que
faz sentido, não como "em andamento".
`.replaceAll('§', '`')

const commentTemplate = `**Sintoma:** a lista de cards não atualizava após mover para outra coluna.
**Causa raiz:** o filtro em cache ignorava o novo columnId.
**Correção:** invalidar o cache ao mover (§app/stores/board.ts§).

**Validação:** lint, typecheck e testes passando; conferido item a item no card.
**Decisões de escopo:** mantive o cache; só corrigi a invalidação.
**Pendências:** verificação visual em dispositivo real.`.replaceAll('§', '`')

const flow = `flowchart LR
  T[Não iniciado] -->|ler card e sinalizar início| P[Em andamento]
  P -->|implementar e validar| Q{Verificado de fato?}
  Q -->|sim| D[Concluído]
  Q -->|falta verificação| X[Validação]
  P -->|bloqueio| B[Comentar e tirar de andamento]
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
      <li>Ao começar, o card é sinalizado como em andamento (coluna, se o board tiver uma), <strong>antes</strong> de qualquer edição de código.</li>
      <li>Em trabalho longo, o andamento é <strong>comentado</strong> a cada marco, e o resultado é conferido ao final.</li>
      <li>Ao terminar, o card vai para a <strong>coluna certa</strong> (se existir) e recebe um <strong>comentário obrigatório</strong> com o que foi feito.</li>
      <li>A task <strong>só conta como concluída</strong> depois de o card ser atualizado e conferido, inclusive se parar por um bloqueio.</li>
      <li>Verificação que o ambiente não consegue fazer vai para a coluna de validação (ex.: Testing), nunca para concluído.</li>
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
        <strong>Colunas diferentes:</strong> a skill se adapta às colunas que existirem; se quiser
        fixar nomes específicos, descreva-os no passo 0.
      </li>
      <li>
        <strong>Backlog em arquivos:</strong> se os cards espelham tarefas de um backlog em Markdown no repositório, acrescente um
        passo mandando abrir esse arquivo e fechá-lo também. Mover o card não substitui isso.
      </li>
      <li>
        <strong>Reforço no MCP:</strong> o servidor MCP também envia instruções ao agente com essas mesmas regras, então elas valem mesmo em projetos que ainda não têm a skill.
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
