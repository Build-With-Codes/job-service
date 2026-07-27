CREATE SCHEMA IF NOT EXISTS "aiverse_jobs";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TYPE "aiverse_jobs"."ProviderStatus" AS ENUM ('ACTIVE', 'PAUSED', 'DISABLED');
CREATE TYPE "aiverse_jobs"."JobStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'REMOVED', 'PAUSED');
CREATE TYPE "aiverse_jobs"."IngestionRunStatus" AS ENUM ('RUNNING', 'COMPLETED', 'FAILED', 'PARTIAL');
CREATE TYPE "aiverse_jobs"."OutboxEventType" AS ENUM ('JOB_CREATED', 'JOB_UPDATED', 'JOB_EXPIRED', 'COMPANY_UPDATED');

CREATE TABLE "aiverse_jobs"."Provider" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "status" "aiverse_jobs"."ProviderStatus" NOT NULL DEFAULT 'ACTIVE',
  "configuration" JSONB,
  "lastSuccessfulSyncAt" TIMESTAMP(3),
  "lastAttemptedSyncAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Provider_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "aiverse_jobs"."Company" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "normalizedName" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "domain" TEXT,
  "website" TEXT,
  "logoUrl" TEXT,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "aiverse_jobs"."Job" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "descriptionText" TEXT,
  "employmentType" TEXT,
  "workplaceType" TEXT,
  "salaryMin" DOUBLE PRECISION,
  "salaryMax" DOUBLE PRECISION,
  "salaryCurrency" TEXT,
  "salaryPeriod" TEXT,
  "postedAt" TIMESTAMP(3),
  "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3),
  "status" "aiverse_jobs"."JobStatus" NOT NULL DEFAULT 'ACTIVE',
  "contentHash" TEXT NOT NULL,
  "dedupeFingerprint" TEXT NOT NULL,
  "missingSyncCount" INTEGER NOT NULL DEFAULT 0,
  "searchVector" tsvector,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "aiverse_jobs"."JobSource" (
  "id" TEXT NOT NULL,
  "jobId" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "sourceJobId" TEXT NOT NULL,
  "sourceUrl" TEXT NOT NULL,
  "canonicalSourceUrl" TEXT NOT NULL,
  "applyUrl" TEXT NOT NULL,
  "rawPayloadLocation" TEXT,
  "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "JobSource_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "aiverse_jobs"."JobLocation" (
  "id" TEXT NOT NULL,
  "jobId" TEXT NOT NULL,
  "city" TEXT,
  "state" TEXT,
  "country" TEXT,
  "countryCode" TEXT,
  "latitude" DOUBLE PRECISION,
  "longitude" DOUBLE PRECISION,
  "isRemote" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "JobLocation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "aiverse_jobs"."Skill" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "normalizedName" TEXT NOT NULL,
  CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "aiverse_jobs"."JobSkill" (
  "jobId" TEXT NOT NULL,
  "skillId" TEXT NOT NULL,
  CONSTRAINT "JobSkill_pkey" PRIMARY KEY ("jobId","skillId")
);

CREATE TABLE "aiverse_jobs"."IngestionRun" (
  "id" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "status" "aiverse_jobs"."IngestionRunStatus" NOT NULL DEFAULT 'RUNNING',
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  "jobsFetched" INTEGER NOT NULL DEFAULT 0,
  "jobsCreated" INTEGER NOT NULL DEFAULT 0,
  "jobsUpdated" INTEGER NOT NULL DEFAULT 0,
  "jobsSkipped" INTEGER NOT NULL DEFAULT 0,
  "jobsExpired" INTEGER NOT NULL DEFAULT 0,
  "jobsFailed" INTEGER NOT NULL DEFAULT 0,
  "errorMessage" TEXT,
  CONSTRAINT "IngestionRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "aiverse_jobs"."IngestionError" (
  "id" TEXT NOT NULL,
  "ingestionRunId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "sourceJobId" TEXT,
  "errorType" TEXT NOT NULL,
  "errorMessage" TEXT NOT NULL,
  "payloadLocation" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "IngestionError_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "aiverse_jobs"."OutboxEvent" (
  "id" TEXT NOT NULL,
  "eventType" "aiverse_jobs"."OutboxEventType" NOT NULL,
  "aggregateType" TEXT NOT NULL,
  "aggregateId" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "processedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OutboxEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Provider_type_key" ON "aiverse_jobs"."Provider"("type");
CREATE INDEX "Provider_status_idx" ON "aiverse_jobs"."Provider"("status");
CREATE UNIQUE INDEX "Company_slug_key" ON "aiverse_jobs"."Company"("slug");
CREATE INDEX "Company_normalizedName_idx" ON "aiverse_jobs"."Company"("normalizedName");
CREATE INDEX "Company_domain_idx" ON "aiverse_jobs"."Company"("domain");
CREATE UNIQUE INDEX "Job_slug_key" ON "aiverse_jobs"."Job"("slug");
CREATE INDEX "Job_companyId_idx" ON "aiverse_jobs"."Job"("companyId");
CREATE INDEX "Job_status_idx" ON "aiverse_jobs"."Job"("status");
CREATE INDEX "Job_dedupeFingerprint_idx" ON "aiverse_jobs"."Job"("dedupeFingerprint");
CREATE INDEX "Job_contentHash_idx" ON "aiverse_jobs"."Job"("contentHash");
CREATE INDEX "Job_postedAt_idx" ON "aiverse_jobs"."Job"("postedAt");
CREATE INDEX "Job_searchVector_idx" ON "aiverse_jobs"."Job" USING GIN ("searchVector");
CREATE INDEX "Job_title_trgm_idx" ON "aiverse_jobs"."Job" USING GIN ("title" gin_trgm_ops);
CREATE INDEX "Job_descriptionText_trgm_idx" ON "aiverse_jobs"."Job" USING GIN ("descriptionText" gin_trgm_ops);
CREATE UNIQUE INDEX "JobSource_providerId_sourceJobId_key" ON "aiverse_jobs"."JobSource"("providerId","sourceJobId");
CREATE INDEX "JobSource_jobId_idx" ON "aiverse_jobs"."JobSource"("jobId");
CREATE INDEX "JobSource_canonicalSourceUrl_idx" ON "aiverse_jobs"."JobSource"("canonicalSourceUrl");
CREATE INDEX "JobLocation_jobId_idx" ON "aiverse_jobs"."JobLocation"("jobId");
CREATE INDEX "JobLocation_countryCode_idx" ON "aiverse_jobs"."JobLocation"("countryCode");
CREATE INDEX "JobLocation_city_idx" ON "aiverse_jobs"."JobLocation"("city");
CREATE INDEX "JobLocation_isRemote_idx" ON "aiverse_jobs"."JobLocation"("isRemote");
CREATE UNIQUE INDEX "Skill_normalizedName_key" ON "aiverse_jobs"."Skill"("normalizedName");
CREATE INDEX "Skill_normalizedName_idx" ON "aiverse_jobs"."Skill"("normalizedName");
CREATE INDEX "IngestionRun_providerId_idx" ON "aiverse_jobs"."IngestionRun"("providerId");
CREATE INDEX "IngestionRun_status_idx" ON "aiverse_jobs"."IngestionRun"("status");
CREATE INDEX "IngestionRun_startedAt_idx" ON "aiverse_jobs"."IngestionRun"("startedAt");
CREATE INDEX "IngestionError_ingestionRunId_idx" ON "aiverse_jobs"."IngestionError"("ingestionRunId");
CREATE INDEX "IngestionError_provider_idx" ON "aiverse_jobs"."IngestionError"("provider");
CREATE INDEX "IngestionError_createdAt_idx" ON "aiverse_jobs"."IngestionError"("createdAt");
CREATE INDEX "OutboxEvent_processedAt_idx" ON "aiverse_jobs"."OutboxEvent"("processedAt");
CREATE INDEX "OutboxEvent_eventType_idx" ON "aiverse_jobs"."OutboxEvent"("eventType");
CREATE INDEX "OutboxEvent_createdAt_idx" ON "aiverse_jobs"."OutboxEvent"("createdAt");

ALTER TABLE "aiverse_jobs"."Job" ADD CONSTRAINT "Job_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "aiverse_jobs"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "aiverse_jobs"."JobSource" ADD CONSTRAINT "JobSource_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "aiverse_jobs"."Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "aiverse_jobs"."JobSource" ADD CONSTRAINT "JobSource_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "aiverse_jobs"."Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "aiverse_jobs"."JobLocation" ADD CONSTRAINT "JobLocation_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "aiverse_jobs"."Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "aiverse_jobs"."JobSkill" ADD CONSTRAINT "JobSkill_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "aiverse_jobs"."Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "aiverse_jobs"."JobSkill" ADD CONSTRAINT "JobSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "aiverse_jobs"."Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "aiverse_jobs"."IngestionRun" ADD CONSTRAINT "IngestionRun_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "aiverse_jobs"."Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "aiverse_jobs"."IngestionError" ADD CONSTRAINT "IngestionError_ingestionRunId_fkey" FOREIGN KEY ("ingestionRunId") REFERENCES "aiverse_jobs"."IngestionRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE OR REPLACE FUNCTION "aiverse_jobs"."job_search_vector_update"()
RETURNS trigger AS $$
BEGIN
  NEW."searchVector" :=
    setweight(to_tsvector('english', coalesce(NEW."title", '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW."descriptionText", '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW."employmentType", '')), 'C') ||
    setweight(to_tsvector('english', coalesce(NEW."workplaceType", '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "Job_searchVector_trigger"
BEFORE INSERT OR UPDATE OF "title", "descriptionText", "employmentType", "workplaceType"
ON "aiverse_jobs"."Job"
FOR EACH ROW EXECUTE FUNCTION "aiverse_jobs"."job_search_vector_update"();
