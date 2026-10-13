# Backlog: Integração Azure DevOps

## Contexto

Trabalho em vários projetos, boards e tipos de work item (Task, Bug, User Story/PBI, …) no Azure DevOps (ADO). O objetivo é ter no ClickLocal:

1. **Visão unificada**: um board "Meu trabalho" com tudo que está atribuído a mim (`@Me`) na organização.
2. **Organização pessoal**: colunas, subtasks, tags e notas próprias, sem poluir o ADO.
3. **Lançamento de horas**: usar o cronômetro local e enviar para `Completed Work`.

O ADO é a fonte da verdade. O ClickLocal lê dele e só escreve de volta em três pontos: **estado** (ao mover para coluna mapeada), **horas** (envio em lote) e **comentários** (publicação opcional).

## Decisões de produto

| Tema | Decisão |
|---|---|
| Direção | Leitura + escrita pontual (estado, horas, comentário) |
| Estrutura | 1 board agregado "Meu trabalho". Aceita cards puramente locais misturados. |
| Escopo | Atribuídos a mim, **todos os tipos** |
| Auth | 1 organização, PAT informado pela UI e salvo no SQLite. Nunca é devolvido ao client. |
| Gatilho do sync | **Só botão manual** "Sincronizar" |
| Colunas | Colunas livres. Cada uma pode mapear para uma categoria de estado (Proposed / InProgress / Resolved / Completed). Mover o card para uma coluna mapeada muda o estado no ADO. |
| Estado mudou no ADO | O card vai para a 1ª coluna mapeada à nova categoria. Se estiver numa coluna sem mapeamento, fica onde está. |
| Saída de escopo | Item fechado, removido ou reatribuído → arquiva o card (mantém os dados locais). Se voltar a ser meu → desarquiva, mas só se foi o sync que arquivou. |
| Título/descrição | Somente leitura, sobrescritos a cada sync |
| Comentários | Locais continuam privados, com ação "Publicar no ADO". A Discussion do ADO aparece numa aba somente leitura. |
| Hierarquia | Breadcrumb `Projeto › Pai #id título` com link. O pai não vira card. |
| Horas | Envio manual em lote que soma em `Completed Work` e não mexe em `Remaining Work`. Item sem esse campo fica bloqueado, com explicação. |
| Exclusão | Card vinculado não pode ser excluído, só arquivado. Senão o próximo sync o recriaria. |
| Horas enviadas | Uma time entry enviada fica travada: não pode ser editada nem excluída. O timer em andamento nunca é enviado. |
| Transição recusada | Se o ADO rejeitar a mudança de estado, o card volta para a coluna de origem e aparece um toast com o erro. |

## Garantias de segurança (nada afeta o ADO sem intenção explícita)

1. **Somente leitura por padrão.** A conexão tem três modos: `readonly` (padrão), `dry-run` e `write`.
   - Em `readonly`, qualquer escrita é recusada no servidor.
   - Em `dry-run`, a escrita não é enviada. O app registra e mostra o JSON Patch que *seria* enviado.
   - Só em `write` algo chega ao ADO. Trocar de modo exige ação manual na página de configuração.
2. **Um único ponto de escrita.** Toda escrita passa por `adoWriteGuard` em `server/utils/azureDevOps.ts`. Nenhum outro código chama PATCH ou POST de escrita diretamente. O guard verifica:
   - o modo;
   - a allowlist de projetos;
   - a allowlist de campos (`System.State` e `Microsoft.VSTS.Scheduling.CompletedWork`);
   - a allowlist de operações: PATCH de work item e criação de comentário. **Nunca** DELETE, nunca criar work item, nunca alterar `AssignedTo`, `Title`, `Description`, `Iteration`, `Area` ou qualquer outro campo.
3. **Allowlist de projetos para escrita.** Na configuração, escolho em quais projetos a escrita é permitida. O padrão é **nenhum**. Itens de outros projetos continuam sincronizando (leitura), mas as ações de escrita ficam desabilitadas na UI e são recusadas no servidor.
4. **O sync nunca escreve.** Usa só `GET` e os endpoints de consulta `wiql` e `workitemsbatch`, que são POST mas apenas leem. Um teste de código garante que `sync.ts` não importa `adoWriteGuard`.
5. **Confirmação antes de cada escrita.**
   - Mover para uma coluna mapeada abre o diálogo "Mudar #123 (Projeto) de *Active* para *Resolved* no Azure DevOps?". Cancelar devolve o card à coluna de origem.
   - O envio de horas mostra o valor atual → novo por item antes de confirmar.
   - Publicar comentário mostra uma prévia.
6. **Concorrência otimista.** Todo PATCH leva `test /rev`. Se alguém alterou o item no meio, a escrita falha em vez de sobrescrever.
7. **Auditoria local reversível.** Cada escrita (ou dry-run) grava no activity log do card o `adoId`, o campo, o valor anterior → novo e o rev. Assim, qualquer mudança pode ser desfeita manualmente no ADO.
8. **PAT com escopo mínimo.** Enquanto só o Épico 1 estiver pronto, usar um PAT com *Work Items (Read)*. Assim, escrever é impossível até na própria API. *Read & Write* só será necessário a partir do Épico 2.
9. **Desenvolvimento e testes nunca em projetos reais.** Todo teste de escrita roda em `dry-run` ou num **projeto sandbox** dedicado, o único na allowlist.

## Arquitetura de referência

O código segue o padrão existente: `server/api/*` (handler fino) → `server/services/*` → `server/repositories/*`. Mutações usam `db.$transaction` + `logActivity` (`server/utils/db.ts`, `server/utils/activity.ts`).

### Modelo de dados

```prisma
model AzureDevOpsConnection {        // singleton (id = 1)
  id                    Int       @id @default(1)
  orgUrl                String    @map("org_url")
  pat                   String
  writeMode             String    @default("readonly") @map("write_mode")        // readonly | dry-run | write
  writeAllowedProjects  String    @default("[]") @map("write_allowed_projects") // JSON string[]
  boardId       Int?      @unique @map("board_id")
  userName      String?   @map("user_name")
  lastSyncedAt  DateTime? @map("last_synced_at")
  board Board? @relation(fields: [boardId], references: [id], onDelete: SetNull)
  @@map("ado_connection")
}

model AdoWorkItem {                  // vínculo 1:1 card ↔ work item
  cardId          Int      @id @map("card_id")
  adoId           Int      @unique @map("ado_id")
  rev             Int
  project         String
  type            String
  state           String
  stateCategory   String   @map("state_category")
  descriptionHtml String?  @map("description_html")
  url             String
  parentAdoId     Int?     @map("parent_ado_id")
  parentTitle     String?  @map("parent_title")
  parentType      String?  @map("parent_type")
  archivedBySync  Boolean  @default(false) @map("archived_by_sync")
  syncedAt        DateTime @map("synced_at")
  card Card @relation(fields: [cardId], references: [id], onDelete: Cascade)
  @@map("ado_work_items")
}

model AdoWorkItemType {              // cache por projeto+tipo
  project               String
  name                  String
  color                 String?
  statesJson            String   @map("states_json")   // [{name, category, order}]
  supportsCompletedWork Boolean  @map("supports_completed_work")
  fetchedAt             DateTime @map("fetched_at")
  @@id([project, name])
  @@map("ado_work_item_types")
}
```

Campos novos em modelos existentes:
- `BoardColumn.adoStateCategory String?`
- `TimeEntry.adoPushedAt DateTime?`
- `Comment.adoCommentId Int?`
- `Card.ado AdoWorkItem?`

O título do card vinculado fica em `Card.title`, sobrescrito no sync, para que busca e filtros continuem funcionando.

### Algoritmo de sync (`syncNow`)

1. **Descobrir**: WIQL no nível da org, `[System.AssignedTo] = @Me AND [System.State] NOT IN ('Closed','Done','Removed','Completed')`.
2. **Juntar** esses IDs com os `adoId` dos cards vinculados que não foram arquivados manualmente, para detectar saída de escopo. Buscar tudo com `POST _apis/wit/workitemsbatch`, em lotes de 200.
3. **Resolver** a `stateCategory` de cada item pelo cache de tipos. Um item está em escopo quando `AssignedTo` sou eu e a categoria não é Completed nem Removed.
4. **Aplicar a cada item**:
   - novo → cria o card na coluna mapeada;
   - existente → atualiza os campos, move o card se a categoria mudou e ele está numa coluna mapeada, e arquiva ou desarquiva conforme o escopo.
5. **Completar** os títulos dos pais (`System.Parent`) com mais um batch.
6. **Gravar** tudo numa transação, com activity log. Retornar `{created, updated, moved, archived, unarchived}`.

---

## Épico 1: Conexão e sync de leitura

### ADO-01 · Schema e migration
Como dev, preciso das tabelas da integração para persistir conexão, vínculos e cache de tipos.
- [x] Adicionar `AzureDevOpsConnection`, `AdoWorkItem` e `AdoWorkItemType` em `prisma/schema.prisma`
- [x] Adicionar `BoardColumn.adoStateCategory`, `TimeEntry.adoPushedAt`, `Comment.adoCommentId` e a relação `Card.ado`
- [x] Gerar a migration com `npm run db:migrate`

**Aceite:** `npm run db:deploy` roda sem erros num banco existente, sem perder dados.

### ADO-02 · Cliente HTTP do Azure DevOps
Como dev, preciso de um cliente único para falar com a API do ADO.
- [x] Criar `server/utils/azureDevOps.ts`: `$fetch` com Basic auth `':' + PAT`, `api-version=7.1` e retry em 429 respeitando `Retry-After`
- [x] Implementar as funções:
  - `connectionData()`
  - `wiql()`
  - `getWorkItemsBatch()`
  - `getWorkItemTypeStates()`
  - `getWorkItemTypeFields()`
  - `patchWorkItem()` (JSON Patch)
  - `listComments()`
  - `addComment()` (`7.1-preview.4`, `format=markdown`)
- [x] Transformar erros do ADO em mensagens legíveis

**Aceite:** com um PAT válido, `connectionData()` devolve meu usuário. Com um PAT inválido, o erro é claro.

### ADO-02b · Guarda de escrita (pré-requisito de qualquer escrita)
Como usuário, quero a garantia de que nada muda no meu Azure DevOps sem que eu tenha habilitado e confirmado.
- [x] Criar `adoWriteGuard({ project, adoId, op, fields })` em `server/utils/azureDevOps.ts`. É o **único** caminho para `patchWorkItem` e `addComment`, que não são exportados sem o guard.
- [x] Recusar a escrita (erro 403 legível) quando:
  - o modo é `readonly`;
  - o projeto está fora de `writeAllowedProjects`;
  - há campo fora da allowlist (`System.State`, `Microsoft.VSTS.Scheduling.CompletedWork`);
  - a operação não é PATCH de work item nem criação de comentário.
- [x] Em `dry-run`, não chamar o ADO. Devolver `{ dryRun: true, patch }` e registrar no activity log.
- [x] Toda escrita real ou dry-run grava a auditoria (campo, anterior → novo, rev)
- [x] Exigir `test /rev` em todo PATCH
- [x] Criar o teste `server/utils/azureDevOps.guard.test.ts` com vitest (adicionar como devDependency), cobrindo:
  - bloqueio em readonly;
  - bloqueio por projeto;
  - bloqueio por campo;
  - dry-run não fazendo chamada HTTP (fetch mockado);
  - `sync.ts` não importando o guard.

**Aceite:** com o modo padrão, nenhuma ação da UI gera requisição de escrita ao ADO. Isso é verificado nos testes e na aba Network.

### ADO-03 · Configuração da conexão
Como usuário, quero informar a URL da org e o PAT pela UI e testar a conexão.
- [x] Criar `server/services/azureDevOps/connection.ts` (salvar, testar, criar o board)
- [x] Criar as rotas `server/api/integrations/azure-devops/index.get.ts` (PAT mascarado), `index.put.ts` e `test.post.ts`
- [x] Criar a página `app/pages/settings/azure-devops.vue` (org URL, PAT, Testar, Salvar, usuário autenticado)
- [x] Na mesma página, criar a seção "Escrita no Azure DevOps":
  - modo (Somente leitura / Dry-run / Escrita), com aviso visual em vermelho no modo Escrita;
  - multi-select dos projetos em que a escrita é permitida (lista vinda de `_apis/projects`, padrão vazio)
- [x] Colocar um link para a página no `BoardSwitcher` / `app/pages/index.vue`
- [x] No primeiro save, criar o board "Meu trabalho" com as colunas A fazer (Proposed), Fazendo (InProgress), Resolvido (Resolved) e Concluído (Completed), reutilizando `createBoard` e `createColumn`

**Aceite:** "Testar" mostra meu nome. Salvar cria o board com 4 colunas mapeadas. O PAT nunca aparece em nenhuma resposta da API. A conexão nasce em `readonly` e sem projetos liberados.

**Nota:** no Épico 1, basta um PAT com *Work Items (Read)*. *Read & Write* só é necessário a partir do Épico 2.

### ADO-04 · Cache de tipos de work item
Como dev, preciso saber os estados, as categorias e o suporte a horas de cada tipo por projeto.
- [x] Criar `server/services/azureDevOps/types.ts` com `resolveType(project, type)`, que busca no ADO quando falta no cache
- [x] Implementar `stateForCategory(project, type, category)`, que devolve o primeiro estado da categoria pela ordem
- [x] Implementar `supportsCompletedWork`, que verifica se o tipo tem o campo `Microsoft.VSTS.Scheduling.CompletedWork`
- [x] Renovar o cache a cada sync manual

**Aceite:** Task (Agile) reporta `supportsCompletedWork = true` e User Story (Agile) reporta `false`.

### ADO-05 · Sincronização manual
Como usuário, quero clicar em "Sincronizar" e ver todos os meus itens de todos os projetos no board.
- [x] Criar `server/services/azureDevOps/sync.ts` seguindo o algoritmo da seção de arquitetura
- [x] Criar a rota `server/api/integrations/azure-devops/sync.post.ts`
- [x] Adicionar os tipos novos de activity em `server/utils/activity.ts`: `ado_synced_changes`, `ado_state_pushed`, `ado_hours_pushed` e `ado_comment_published`
- [x] Adicionar a ação `syncAdo()` em `app/composables/useBoardStore.ts`
- [x] Em `app/pages/boards/[id].vue`, mostrar os botões "Sincronizar" e "Última sync" quando o board for o da integração. O resumo aparece em toast.

**Aceite:**
- aparecem itens de ≥2 projetos e tipos diferentes;
- cards locais não são tocados;
- um item reatribuído é arquivado, e desarquivado quando volta;
- se o estado mudou no ADO, o card se move, exceto quando está em coluna pessoal.

### ADO-06 · Exibição de cards vinculados
Como usuário, quero identificar de onde cada card vem e ver o contexto dele.
- [x] Incluir `ado` e `adoStateCategory` das colunas em `server/services/boards.ts` (`getBoardFull`) e em `boardRepository.findByIdWithColumnsAndCards`
- [x] Incluir `ado` em `server/repositories/cardRepository.ts` (`findByIdWithRelations`)
- [x] Adicionar os tipos `BoardCard.ado` e `BoardColumnWithCards.adoStateCategory` no store
- [x] Em `app/components/board/BoardCard.vue`, mostrar um badge com tipo (cor do cache), `#id`, estado e projeto
- [x] Em `app/components/card/CardModal.vue`:
  - breadcrumb `Projeto › Tipo #pai título`;
  - botão "Abrir no ADO";
  - título e descrição somente leitura, com a descrição em HTML sanitizado (adicionar `dompurify`)

**Aceite:** um card vinculado mostra badge e breadcrumb, e os links abrem o ADO. Não dá para editar título nem descrição.

### ADO-07 · Proteções em card vinculado
- [x] `server/services/cards.ts`: `deleteCard` recusa card vinculado com 409, e `updateCard` ignora `title`/`description` de card vinculado
- [x] Na UI, esconder "Excluir" em card vinculado e deixar só "Arquivar"

**Aceite:** um DELETE na API em card vinculado retorna 409.

---

## Épico 2: Estado via colunas

### ADO-08 · Mapeamento de coluna para categoria de estado
Como usuário, quero dizer quais colunas correspondem a quais estados do ADO.
- [x] Aceitar `adoStateCategory` em `server/services/columns.ts` e `server/api/columns/[id].patch.ts`
- [x] Em `app/components/board/BoardColumn.vue`, adicionar no menu o select "Estado no ADO" (nenhum / Proposed / InProgress / Resolved / Completed) e um indicador visual

**Aceite:** o mapeamento persiste e aparece na coluna.

### ADO-09 · Enviar estado ao mover card
Como usuário, quero que arrastar um card para uma coluna mapeada mude o estado no ADO.
- [x] Criar `server/services/azureDevOps/state.ts` com `pushStateForMoves(moves)`: resolve o estado concreto e faz PATCH de `System.State` **via `adoWriteGuard`**
- [x] Chamar essa função em `reorderCards` (`server/services/cards.ts`). Em falha ou bloqueio do guard, voltar o card para a coluna e posição anteriores e devolver `{ failures }`.
- [x] Antes de persistir o move de um card vinculado para uma coluna mapeada, abrir o diálogo de confirmação com `#id`, projeto e estado atual → novo (reutilizar `useConfirm`). Cancelar desfaz o drag. Se o projeto não está liberado ou o modo é readonly, o diálogo explica isso e o card volta.
- [x] Em `persistCardOrder` (`useBoardStore.ts`), tratar `failures`: recarregar o board e mostrar toast com a mensagem
- [x] Registrar `ado_state_pushed` no activity log com anterior → novo e rev

**Aceite:**
- Em `readonly`, mover o card não gera requisição ao ADO e o card volta.
- Em `dry-run`, o toast mostra o patch que seria enviado.
- Em `write`, no projeto sandbox, o item fica Active depois da confirmação.
- Uma transição proibida pelo workflow devolve o card e mostra o erro.
- Mover para uma coluna sem mapeamento nunca chama o ADO.

---

## Épico 3: Horas

### ADO-10 · Travar entries enviadas
- [x] Em `server/services/timeEntries.ts`, fazer `updateManualEntry` e `deleteEntry` recusarem entry com `adoPushedAt` (409)
- [x] Em `app/components/card/TimeTracker.vue`, mostrar a entry enviada travada com um ícone e, em tipo sem suporte, o aviso "Este tipo não tem Completed Work; horas ficam só locais"

### ADO-11 · Envio de horas em lote
Como usuário, quero revisar as horas pendentes e enviá-las para `Completed Work`.
- [x] Criar `server/services/azureDevOps/hours.ts`:
  - `listPendingHours()` pega as entries com `endedAt != null` e `adoPushedAt == null`, agrupadas por card;
  - `pushHours(cardIds)` faz GET do rev e do valor atuais e depois PATCH `[test /rev, add CompletedWork = atual + round(ms/3.6e6, 2)]` **via `adoWriteGuard`**. Se o rev mudou no meio, refaz uma vez. No fim, marca `adoPushedAt` (só em escrita real, nunca em dry-run) e registra `ado_hours_pushed`.
- [x] Criar as rotas `pending-hours.get.ts` e `push-hours.post.ts`
- [x] Criar `app/components/board/PushHoursDialog.vue`:
  - lista com checkboxes e **prévia** do `Completed Work` atual → novo por item;
  - itens sem suporte ou de projeto não liberado ficam desabilitados, com o motivo;
  - banner do modo atual (readonly / dry-run / write)
- [x] Colocar o botão "Enviar horas" no header do board da integração

**Aceite:** 30 min numa Task fazem `Completed Work` subir 0,5. A entry fica travada. A User Story aparece bloqueada no diálogo. O timer em andamento não entra.

---

## Épico 4: Comentários

### ADO-12 · Publicar comentário local no ADO
- [x] Criar `server/services/azureDevOps/comments.ts` com `publishComment(commentId)` **via `adoWriteGuard`**, que grava `adoCommentId` e registra `ado_comment_published`
- [x] Criar a rota `server/api/comments/[id]/publish.post.ts`
- [x] No `CardModal`/`useCard.ts`, adicionar a ação "Publicar no ADO" por comentário, com um diálogo de prévia e confirmação, e o badge "publicado"

**Aceite:** o comentário aparece na Discussion do ADO. Não dá para publicar o mesmo comentário duas vezes.

### ADO-13 · Aba Discussion (somente leitura)
- [x] Criar `listAdoDiscussion(cardId)`, que busca ao vivo sem persistir
- [x] Criar a rota `server/api/cards/[id]/ado-discussion.get.ts`
- [x] Adicionar a aba "Discussion (ADO)" no `CardModal`

**Aceite:** a aba mostra os comentários do ADO com autor e data.

---

## Fora de escopo / riscos
- Imagens embutidas na descrição do ADO exigem autenticação. Na v1 elas aparecem quebradas. Futuro: proxy via servidor usando o PAT.
- O PAT fica em texto puro no SQLite local. É a mesma proteção dos demais dados, já que o app não tem autenticação.
- Estados customizados com nomes fora da lista padrão entram na WIQL, mas são filtrados corretamente pela categoria.
- Não há criação de work item pelo ClickLocal nem edição de campos além de estado, horas e comentário.

## Verificação geral
- Rodar `npm run lint`, `npm run typecheck` e os testes do guard (vitest) a cada história.
- **Leitura (Épico 1):** rodar contra a org real com um PAT *somente leitura*. Não há risco de escrita.
- **Escrita (Épicos 2–4):**
  1. validar primeiro em `dry-run` nos projetos reais, conferindo os patches mostrados;
  2. depois, em `write` **apenas no projeto sandbox** (criar um projeto de teste, ou usar uma org gratuita separada), que é o único na allowlist;
  3. só liberar projetos reais na allowlist quando tudo estiver validado, e por decisão manual.
- Conferir na aba Network do navegador e no activity log que, em `readonly`, nenhuma requisição PATCH ou POST de escrita sai para `dev.azure.com`.
