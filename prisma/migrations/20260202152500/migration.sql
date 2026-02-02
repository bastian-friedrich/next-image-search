-- CreateTable
CREATE TABLE "SearchLog" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "query" TEXT,
    "restriction" TEXT,
    "credit" TEXT,
    "date" TEXT,
    "page" INTEGER NOT NULL,
    "pageSize" INTEGER NOT NULL,
    "sort" TEXT NOT NULL,
    "responseMs" INTEGER NOT NULL,
    "resultCount" INTEGER NOT NULL,

    CONSTRAINT "SearchLog_pkey" PRIMARY KEY ("id")
);
