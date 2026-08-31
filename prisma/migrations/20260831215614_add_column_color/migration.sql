-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_board_columns" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "board_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6d5ce8',
    "position" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "board_columns_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "boards" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_board_columns" ("board_id", "created_at", "id", "name", "position", "updated_at") SELECT "board_id", "created_at", "id", "name", "position", "updated_at" FROM "board_columns";
DROP TABLE "board_columns";
ALTER TABLE "new_board_columns" RENAME TO "board_columns";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
