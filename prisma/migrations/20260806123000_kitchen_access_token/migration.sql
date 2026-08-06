ALTER TABLE "Event" ADD COLUMN "kitchenToken" TEXT;

CREATE UNIQUE INDEX "Event_kitchenToken_key" ON "Event"("kitchenToken");
