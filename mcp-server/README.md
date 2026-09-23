# ClickLocal MCP Server

Servidor MCP (Model Context Protocol) que expõe o backlog do [ClickLocal](../README.md) — boards, cards, subtasks, tags, comentários e horas — como um conjunto de tools que qualquer agente/projeto configurado com um cliente MCP pode consultar e gerenciar.

Não acessa o banco de dados diretamente: chama a API HTTP do próprio ClickLocal (`server/api/**`), reaproveitando toda a validação e regras de negócio já implementadas lá.

## Pré-requisito

O ClickLocal precisa estar rodando e acessível via HTTP (padrão: `http://localhost:8880`), seja via `npm run dev` na raiz do repositório, seja via o container Docker do projeto.

## Instalação e build

```bash
cd mcp-server
npm install
npm run build
```

Isso gera `dist/index.js`, um executável Node único (com shebang) que fala o protocolo MCP via stdio.

## Configuração

Uma única variável de ambiente, opcional:

| Variável | Default | Descrição |
|---|---|---|
| `CLICKLOCAL_API_URL` | `http://localhost:8880/api` | URL base da API do ClickLocal a ser usada |

Não há autenticação — o ClickLocal em si não tem contas/API keys, então o MCP também não precisa de nenhuma.

## Uso em outros projetos

### Claude Code (`.mcp.json`)

```json
{
  "mcpServers": {
    "clicklocal": {
      "command": "node",
      "args": ["/caminho/absoluto/para/ClickLocal/mcp-server/dist/index.js"],
      "env": { "CLICKLOCAL_API_URL": "http://localhost:8880/api" }
    }
  }
}
```

### Claude Desktop (`claude_desktop_config.json`)

```json
{
  "mcpServers": {
    "clicklocal": {
      "command": "node",
      "args": ["/caminho/absoluto/para/ClickLocal/mcp-server/dist/index.js"],
      "env": { "CLICKLOCAL_API_URL": "http://localhost:8880/api" }
    }
  }
}
```

Ajuste o caminho absoluto do `dist/index.js` conforme onde o repositório do ClickLocal estiver clonado.

## Restrição importante: board do Azure DevOps

O ClickLocal pode sincronizar um board com o Azure DevOps (integração descrita em [`docs/backlog-azure-devops.md`](../docs/backlog-azure-devops.md)). Esse board é gerenciado automaticamente pela sincronização e **não é acessível através deste MCP**, nem para leitura nem para escrita:

- Ele não aparece em `clicklocal_list_boards`.
- Qualquer tentativa de ler, criar, editar ou mover cards para dentro dele retorna erro.

Isso evita que um agente externo interfira na sincronização com o Azure DevOps ou em cards vinculados a work items reais.

## Tools disponíveis

**Boards**
| Tool | Descrição |
|---|---|
| `clicklocal_list_boards` | Lista os boards (exceto o board do Azure DevOps) |
| `clicklocal_get_board` | Board completo com colunas e cards |
| `clicklocal_list_board_tags` | Lista as tags de um board |
| `clicklocal_create_board_tag` | Cria uma tag em um board |
| `clicklocal_list_archived_cards` | Lista cards arquivados de um board |

**Cards**
| Tool | Descrição |
|---|---|
| `clicklocal_list_cards` | Lista cards de um board (filtro opcional por coluna/arquivados) |
| `clicklocal_get_card` | Detalhes de um card |
| `clicklocal_create_card` | Cria um card (item de backlog) |
| `clicklocal_create_child_card` | Cria um card filho |
| `clicklocal_update_card` | Edita título/descrição/prazo/arquivamento ou move de coluna |
| `clicklocal_delete_card` | Exclui um card |

**Tags em card**
| Tool | Descrição |
|---|---|
| `clicklocal_attach_tag_to_card` | Associa uma tag a um card |
| `clicklocal_detach_tag_from_card` | Remove uma tag de um card |

**Subtasks**
| Tool | Descrição |
|---|---|
| `clicklocal_create_subtask` | Cria uma subtask |
| `clicklocal_update_subtask` | Renomeia/marca como concluída |
| `clicklocal_delete_subtask` | Exclui uma subtask |

**Comentários**
| Tool | Descrição |
|---|---|
| `clicklocal_list_comments` | Lista comentários de um card |
| `clicklocal_add_comment` | Adiciona um comentário (markdown) |
| `clicklocal_update_comment` | Edita um comentário |
| `clicklocal_delete_comment` | Exclui um comentário |

**Horas**
| Tool | Descrição |
|---|---|
| `clicklocal_list_time_entries` | Lista registros de tempo de um card |
| `clicklocal_log_time_entry` | Registra horas manualmente |
| `clicklocal_delete_time_entry` | Exclui um registro de tempo |

> Algumas tools de edição por sub-recurso (`update_subtask`, `delete_subtask`, `update_comment`, `delete_comment`, `delete_time_entry`) exigem `cardId` no input mesmo a API do ClickLocal não precisando dele — é usado só localmente para verificar que o card não pertence ao board do Azure DevOps.

Fora de escopo desta v1: CRUD de boards/colunas, gestão da integração com Azure DevOps e attachments.

## Tratamento de erros

- Se a API do ClickLocal não estiver acessível, as tools retornam um erro explicando isso e como corrigir (`npm run dev` ou ajustar `CLICKLOCAL_API_URL`), em vez de travar o processo.
- Erros da própria API (validação, card não encontrado, etc.) são repassados com a mensagem original.

## Desenvolvimento

```bash
npm run dev        # watch mode via tsx
npm run typecheck  # checagem de tipos sem build
npm run build      # gera dist/index.js
```
