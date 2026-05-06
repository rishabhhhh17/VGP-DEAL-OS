-- CreateTable
CREATE TABLE "ScreenerCriteria" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fundMandate" TEXT,
    "sectorPrefs" TEXT,
    "teamRequirements" TEXT,
    "tractionReqs" TEXT,
    "marketSize" TEXT,
    "dealStructure" TEXT,
    "redFlags" TEXT,
    "otherCriteria" TEXT,
    "updatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ScreeningResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyName" TEXT NOT NULL,
    "dealId" TEXT,
    "sector" TEXT,
    "stage" TEXT,
    "context" TEXT,
    "overallScore" INTEGER NOT NULL,
    "fitLevel" TEXT NOT NULL,
    "fullResult" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ScreeningResult_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
