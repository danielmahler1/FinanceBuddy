-- AlterTable
ALTER TABLE "Transaction" ALTER COLUMN "type" DROP NOT NULL;

-- CreateTable
CREATE TABLE "authentication" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "authentication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "authentication_user_id_idx" ON "authentication"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "authentication_provider_provider_user_id_key" ON "authentication"("provider", "provider_user_id");

-- CreateIndex
CREATE INDEX "Transaction_accountId_createdAt_idx" ON "Transaction"("accountId", "createdAt");

-- AddForeignKey
ALTER TABLE "authentication" ADD CONSTRAINT "authentication_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
