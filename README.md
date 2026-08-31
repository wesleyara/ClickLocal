# ClickLocal

Board de tasks local, estilo Trello/ClickUp — sem nuvem, sem conta, sem
autenticação. Múltiplos boards, colunas e cards com drag-and-drop,
subtasks, tags, descrição e comentários em markdown, cronômetro +
lançamento manual de tempo, e histórico de mudanças por card.

Stack: Nuxt 4 + Nuxt UI, Prisma + SQLite (arquivo local em `data/`),
Pinia, `vue-draggable-plus`, `md-editor-v3`.

## Rodando localmente (npm)

Requer Node 22+.

```bash
npm install
cp .env.example .env
npm run db:deploy
npm run dev
```

A aplicação sobe em `http://localhost:8880`.

## Rodando com Docker

Não precisa instalar Node nem nada localmente — só Docker.

```bash
docker compose up --build
```

A aplicação sobe em `http://localhost:8880`. Os dados ficam em `./data`
no host (montado como volume), então persistem entre restarts e
rebuilds do container.

Sem `docker compose`, equivalente na mão:

```bash
docker build -t clicklocal .
docker run -p 8880:8880 -v $(pwd)/data:/app/data clicklocal
```

O container aplica as migrations do Prisma automaticamente ao subir
(`prisma migrate deploy`) antes de iniciar o servidor.

## Scripts

- `npm run dev` — servidor de desenvolvimento (porta 8880)
- `npm run build` — build de produção (`.output/`)
- `npm run preview` — roda o build de produção localmente
- `npm run db:migrate` — cria e aplica uma nova migration a partir de
  mudanças no `prisma/schema.prisma` (modo dev, interativo)
- `npm run db:deploy` — aplica migrations pendentes sem prompts (usado
  pelo Docker e em produção)
- `npm run lint` / `npm run typecheck`
