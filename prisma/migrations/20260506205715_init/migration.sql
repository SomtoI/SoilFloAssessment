-- CreateTable
CREATE TABLE "sites" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "description" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "trucks" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "license" TEXT NOT NULL,
    "siteId" INTEGER NOT NULL,
    CONSTRAINT "trucks_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ticketNumber" INTEGER NOT NULL,
    "material" TEXT NOT NULL DEFAULT 'Soil',
    "dispatchedAt" DATETIME NOT NULL,
    "truckId" INTEGER NOT NULL,
    "siteId" INTEGER NOT NULL,
    CONSTRAINT "tickets_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "trucks" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "tickets_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "trucks_siteId_idx" ON "trucks"("siteId");

-- CreateIndex
CREATE INDEX "tickets_dispatchedAt_idx" ON "tickets"("dispatchedAt");

-- CreateIndex
CREATE INDEX "tickets_siteId_dispatchedAt_idx" ON "tickets"("siteId", "dispatchedAt");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_truckId_dispatchedAt_key" ON "tickets"("truckId", "dispatchedAt");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_siteId_ticketNumber_key" ON "tickets"("siteId", "ticketNumber");
