-- AlterTable
ALTER TABLE "board_columns" ADD COLUMN "ado_state_category" TEXT;

-- AlterTable
ALTER TABLE "comments" ADD COLUMN "ado_comment_id" INTEGER;

-- AlterTable
ALTER TABLE "time_entries" ADD COLUMN "ado_pushed_at" DATETIME;

-- CreateTable
CREATE TABLE "ado_connection" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "org_url" TEXT NOT NULL,
    "pat" TEXT NOT NULL,
    "write_mode" TEXT NOT NULL DEFAULT 'readonly',
    "write_allowed_projects" TEXT NOT NULL DEFAULT '[]',
    "board_id" INTEGER,
    "user_name" TEXT,
    "last_synced_at" DATETIME,
    CONSTRAINT "ado_connection_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "boards" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ado_work_items" (
    "card_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ado_id" INTEGER NOT NULL,
    "rev" INTEGER NOT NULL,
    "project" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "state_category" TEXT NOT NULL,
    "description_html" TEXT,
    "url" TEXT NOT NULL,
    "parent_ado_id" INTEGER,
    "parent_title" TEXT,
    "parent_type" TEXT,
    "archived_by_sync" BOOLEAN NOT NULL DEFAULT false,
    "synced_at" DATETIME NOT NULL,
    CONSTRAINT "ado_work_items_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ado_work_item_types" (
    "project" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "states_json" TEXT NOT NULL,
    "supports_completed_work" BOOLEAN NOT NULL,
    "fetched_at" DATETIME NOT NULL,

    PRIMARY KEY ("project", "name")
);

-- CreateIndex
CREATE UNIQUE INDEX "ado_connection_board_id_key" ON "ado_connection"("board_id");

-- CreateIndex
CREATE UNIQUE INDEX "ado_work_items_ado_id_key" ON "ado_work_items"("ado_id");
