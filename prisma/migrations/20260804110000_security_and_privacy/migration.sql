ALTER TABLE "Restaurant"
ADD COLUMN "failedPinAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "lockedUntil" TIMESTAMP(3);

ALTER TABLE "Event" ADD COLUMN "organizerToken" TEXT;

UPDATE "Event"
SET "organizerToken" = md5(random()::text || clock_timestamp()::text || "id") || md5("id" || random()::text)
WHERE "organizerToken" IS NULL;

ALTER TABLE "Event" ALTER COLUMN "organizerToken" SET NOT NULL;

CREATE UNIQUE INDEX "Event_organizerToken_key" ON "Event"("organizerToken");
CREATE UNIQUE INDEX "Guest_eventId_normalizedName_key" ON "Guest"("eventId", "normalizedName");
