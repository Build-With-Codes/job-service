CREATE TABLE "aiverse_jobs"."PromptEvent" (
  "id" TEXT NOT NULL,
  "promptId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "visitorKey" TEXT,
  "idempotencyKey" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PromptEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PromptEvent_promptId_eventType_idempotencyKey_key"
  ON "aiverse_jobs"."PromptEvent"("promptId", "eventType", "idempotencyKey");
CREATE INDEX "PromptEvent_promptId_idx" ON "aiverse_jobs"."PromptEvent"("promptId");
CREATE INDEX "PromptEvent_eventType_idx" ON "aiverse_jobs"."PromptEvent"("eventType");
CREATE INDEX "PromptEvent_visitorKey_idx" ON "aiverse_jobs"."PromptEvent"("visitorKey");
CREATE INDEX "PromptEvent_createdAt_idx" ON "aiverse_jobs"."PromptEvent"("createdAt");

ALTER TABLE "aiverse_jobs"."PromptEvent"
  ADD CONSTRAINT "PromptEvent_promptId_fkey"
  FOREIGN KEY ("promptId") REFERENCES "aiverse_jobs"."Prompt"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
