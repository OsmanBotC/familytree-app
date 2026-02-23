-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "birthDate" DATETIME,
    "deathDate" DATETIME,
    "nationality" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Residency" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "personId" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "fromDate" DATETIME,
    "toDate" DATETIME,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Residency_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Relationship" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fromPersonId" TEXT NOT NULL,
    "toPersonId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "notes" TEXT,
    CONSTRAINT "Relationship_fromPersonId_fkey" FOREIGN KEY ("fromPersonId") REFERENCES "Person" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Relationship_toPersonId_fkey" FOREIGN KEY ("toPersonId") REFERENCES "Person" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Relationship_fromPersonId_toPersonId_type_key" ON "Relationship"("fromPersonId", "toPersonId", "type");
