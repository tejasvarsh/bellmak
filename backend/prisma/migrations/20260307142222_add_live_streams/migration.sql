-- CreateTable
CREATE TABLE "live_streams" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "channelName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'LIVE',
    "productIds" TEXT[],
    "viewerCount" INTEGER NOT NULL DEFAULT 0,
    "thumbnail" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "live_streams_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "live_streams_channelName_key" ON "live_streams"("channelName");

-- AddForeignKey
ALTER TABLE "live_streams" ADD CONSTRAINT "live_streams_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "sellers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
