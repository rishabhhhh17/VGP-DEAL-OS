-- CreateTable
CREATE TABLE "Deal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyName" TEXT NOT NULL,
    "stage" TEXT NOT NULL DEFAULT 'SOURCING',
    "sector" TEXT,
    "checkSize" TEXT,
    "source" TEXT,
    "thesis" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
