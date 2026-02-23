-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Person" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "birthDate" DATETIME,
    "deathDate" DATETIME,
    "gender" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "nationality" TEXT NOT NULL,
    "notes" TEXT,
    "posX" REAL,
    "posY" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Person" ("birthDate", "createdAt", "deathDate", "firstName", "id", "lastName", "nationality", "notes", "updatedAt") SELECT "birthDate", "createdAt", "deathDate", "firstName", "id", "lastName", "nationality", "notes", "updatedAt" FROM "Person";
DROP TABLE "Person";
ALTER TABLE "new_Person" RENAME TO "Person";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
