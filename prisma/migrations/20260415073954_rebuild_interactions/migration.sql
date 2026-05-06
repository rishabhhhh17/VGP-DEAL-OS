/*
  Warnings:

  - You are about to drop the column `notes` on the `Interaction` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Interaction` table. All the data in the column will be lost.
  - Added the required column `personName` to the `Interaction` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Config" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Interaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dealId" TEXT,
    "date" DATETIME NOT NULL,
    "personName" TEXT NOT NULL,
    "companyName" TEXT,
    "companyUrl" TEXT,
    "context" TEXT,
    "mandate" TEXT,
    "interactionType" TEXT,
    "origination" TEXT,
    "referralTouchpoint" TEXT,
    "vgpPoc" TEXT,
    "outcome" TEXT,
    "takeaways" TEXT,
    "nextSteps" TEXT,
    "deadline" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Interaction_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Interaction" ("createdAt", "date", "dealId", "id", "outcome", "updatedAt") SELECT "createdAt", "date", "dealId", "id", "outcome", "updatedAt" FROM "Interaction";
DROP TABLE "Interaction";
ALTER TABLE "new_Interaction" RENAME TO "Interaction";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
