-- CreateTable
CREATE TABLE "IpBan" (
    "network" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IpBan_pkey" PRIMARY KEY ("network")
);
