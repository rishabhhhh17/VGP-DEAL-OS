-- CreateTable
CREATE TABLE "ImportBatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "filename" TEXT NOT NULL,
    "rowCount" INTEGER NOT NULL,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "importedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Interaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dealId" TEXT,
    "importBatchId" TEXT,
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
    CONSTRAINT "Interaction_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Interaction_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "ImportBatch" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Interaction" ("companyName", "companyUrl", "context", "createdAt", "date", "deadline", "dealId", "id", "interactionType", "mandate", "nextSteps", "origination", "outcome", "personName", "referralTouchpoint", "takeaways", "updatedAt", "vgpPoc") SELECT "companyName", "companyUrl", "context", "createdAt", "date", "deadline", "dealId", "id", "interactionType", "mandate", "nextSteps", "origination", "outcome", "personName", "referralTouchpoint", "takeaways", "updatedAt", "vgpPoc" FROM "Interaction";
DROP TABLE "Interaction";
ALTER TABLE "new_Interaction" RENAME TO "Interaction";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
