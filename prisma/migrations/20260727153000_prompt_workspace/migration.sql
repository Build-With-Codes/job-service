CREATE TABLE "aiverse_jobs"."Prompt" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "prompt" TEXT NOT NULL,
  "promptType" TEXT NOT NULL,
  "difficulty" TEXT NOT NULL,
  "authorName" TEXT,
  "sourceUrl" TEXT,
  "license" TEXT,
  "supportedModels" TEXT[] NOT NULL,
  "variables" JSONB,
  "exampleInput" JSONB,
  "exampleOutput" TEXT,
  "qualityScore" INTEGER NOT NULL DEFAULT 0,
  "readabilityScore" INTEGER NOT NULL DEFAULT 0,
  "structureScore" INTEGER NOT NULL DEFAULT 0,
  "variablesScore" INTEGER NOT NULL DEFAULT 0,
  "reusabilityScore" INTEGER NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
  "featured" BOOLEAN NOT NULL DEFAULT false,
  "trendingScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Prompt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "aiverse_jobs"."PromptVersion" (
  "id" TEXT NOT NULL,
  "promptId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "prompt" TEXT NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PromptVersion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "aiverse_jobs"."PromptCategory" (
  "id" TEXT NOT NULL,
  "promptId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  CONSTRAINT "PromptCategory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "aiverse_jobs"."PromptTag" (
  "id" TEXT NOT NULL,
  "promptId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  CONSTRAINT "PromptTag_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "aiverse_jobs"."PromptSource" (
  "id" TEXT NOT NULL,
  "promptId" TEXT NOT NULL,
  "sourceType" TEXT NOT NULL,
  "sourceName" TEXT NOT NULL,
  "sourceUrl" TEXT,
  "contentHash" TEXT NOT NULL,
  "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PromptSource_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "aiverse_jobs"."PromptEmbedding" (
  "id" TEXT NOT NULL,
  "promptId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "vector" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PromptEmbedding_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "aiverse_jobs"."PromptStat" (
  "promptId" TEXT NOT NULL,
  "views" INTEGER NOT NULL DEFAULT 0,
  "copies" INTEGER NOT NULL DEFAULT 0,
  "saves" INTEGER NOT NULL DEFAULT 0,
  "likes" INTEGER NOT NULL DEFAULT 0,
  "shares" INTEGER NOT NULL DEFAULT 0,
  "reports" INTEGER NOT NULL DEFAULT 0,
  "weeklyGrowth" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "lastViewedAt" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PromptStat_pkey" PRIMARY KEY ("promptId")
);

CREATE TABLE "aiverse_jobs"."PromptFavorite" (
  "id" TEXT NOT NULL,
  "promptId" TEXT NOT NULL,
  "userKey" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PromptFavorite_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "aiverse_jobs"."PromptCollection" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "ownerKey" TEXT,
  "public" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PromptCollection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "aiverse_jobs"."PromptCollectionPrompt" (
  "collectionId" TEXT NOT NULL,
  "promptId" TEXT NOT NULL,
  "position" INTEGER NOT NULL DEFAULT 0,
  "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PromptCollectionPrompt_pkey" PRIMARY KEY ("collectionId","promptId")
);

CREATE TABLE "aiverse_jobs"."PromptCrawlLog" (
  "id" TEXT NOT NULL,
  "sourceType" TEXT NOT NULL,
  "sourceUrl" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "promptsFound" INTEGER NOT NULL DEFAULT 0,
  "promptsSaved" INTEGER NOT NULL DEFAULT 0,
  "errorMessage" TEXT,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "PromptCrawlLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Prompt_slug_key" ON "aiverse_jobs"."Prompt"("slug");
CREATE INDEX "Prompt_status_idx" ON "aiverse_jobs"."Prompt"("status");
CREATE INDEX "Prompt_featured_idx" ON "aiverse_jobs"."Prompt"("featured");
CREATE INDEX "Prompt_promptType_idx" ON "aiverse_jobs"."Prompt"("promptType");
CREATE INDEX "Prompt_difficulty_idx" ON "aiverse_jobs"."Prompt"("difficulty");
CREATE INDEX "Prompt_trendingScore_idx" ON "aiverse_jobs"."Prompt"("trendingScore");
CREATE INDEX "Prompt_qualityScore_idx" ON "aiverse_jobs"."Prompt"("qualityScore");
CREATE INDEX "Prompt_publishedAt_idx" ON "aiverse_jobs"."Prompt"("publishedAt");
CREATE UNIQUE INDEX "PromptVersion_promptId_version_key" ON "aiverse_jobs"."PromptVersion"("promptId","version");
CREATE INDEX "PromptVersion_promptId_idx" ON "aiverse_jobs"."PromptVersion"("promptId");
CREATE UNIQUE INDEX "PromptCategory_promptId_slug_key" ON "aiverse_jobs"."PromptCategory"("promptId","slug");
CREATE INDEX "PromptCategory_slug_idx" ON "aiverse_jobs"."PromptCategory"("slug");
CREATE UNIQUE INDEX "PromptTag_promptId_slug_key" ON "aiverse_jobs"."PromptTag"("promptId","slug");
CREATE INDEX "PromptTag_slug_idx" ON "aiverse_jobs"."PromptTag"("slug");
CREATE INDEX "PromptSource_promptId_idx" ON "aiverse_jobs"."PromptSource"("promptId");
CREATE INDEX "PromptSource_sourceType_idx" ON "aiverse_jobs"."PromptSource"("sourceType");
CREATE INDEX "PromptSource_contentHash_idx" ON "aiverse_jobs"."PromptSource"("contentHash");
CREATE INDEX "PromptEmbedding_promptId_idx" ON "aiverse_jobs"."PromptEmbedding"("promptId");
CREATE INDEX "PromptEmbedding_provider_model_idx" ON "aiverse_jobs"."PromptEmbedding"("provider","model");
CREATE INDEX "PromptStat_copies_idx" ON "aiverse_jobs"."PromptStat"("copies");
CREATE INDEX "PromptStat_saves_idx" ON "aiverse_jobs"."PromptStat"("saves");
CREATE INDEX "PromptStat_views_idx" ON "aiverse_jobs"."PromptStat"("views");
CREATE INDEX "PromptStat_weeklyGrowth_idx" ON "aiverse_jobs"."PromptStat"("weeklyGrowth");
CREATE UNIQUE INDEX "PromptFavorite_promptId_userKey_key" ON "aiverse_jobs"."PromptFavorite"("promptId","userKey");
CREATE INDEX "PromptFavorite_userKey_idx" ON "aiverse_jobs"."PromptFavorite"("userKey");
CREATE UNIQUE INDEX "PromptCollection_slug_key" ON "aiverse_jobs"."PromptCollection"("slug");
CREATE INDEX "PromptCollection_public_idx" ON "aiverse_jobs"."PromptCollection"("public");
CREATE INDEX "PromptCollection_ownerKey_idx" ON "aiverse_jobs"."PromptCollection"("ownerKey");
CREATE INDEX "PromptCollectionPrompt_promptId_idx" ON "aiverse_jobs"."PromptCollectionPrompt"("promptId");
CREATE INDEX "PromptCrawlLog_sourceType_idx" ON "aiverse_jobs"."PromptCrawlLog"("sourceType");
CREATE INDEX "PromptCrawlLog_status_idx" ON "aiverse_jobs"."PromptCrawlLog"("status");
CREATE INDEX "PromptCrawlLog_startedAt_idx" ON "aiverse_jobs"."PromptCrawlLog"("startedAt");

ALTER TABLE "aiverse_jobs"."PromptVersion" ADD CONSTRAINT "PromptVersion_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "aiverse_jobs"."Prompt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "aiverse_jobs"."PromptCategory" ADD CONSTRAINT "PromptCategory_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "aiverse_jobs"."Prompt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "aiverse_jobs"."PromptTag" ADD CONSTRAINT "PromptTag_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "aiverse_jobs"."Prompt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "aiverse_jobs"."PromptSource" ADD CONSTRAINT "PromptSource_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "aiverse_jobs"."Prompt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "aiverse_jobs"."PromptEmbedding" ADD CONSTRAINT "PromptEmbedding_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "aiverse_jobs"."Prompt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "aiverse_jobs"."PromptStat" ADD CONSTRAINT "PromptStat_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "aiverse_jobs"."Prompt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "aiverse_jobs"."PromptFavorite" ADD CONSTRAINT "PromptFavorite_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "aiverse_jobs"."Prompt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "aiverse_jobs"."PromptCollectionPrompt" ADD CONSTRAINT "PromptCollectionPrompt_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "aiverse_jobs"."PromptCollection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "aiverse_jobs"."PromptCollectionPrompt" ADD CONSTRAINT "PromptCollectionPrompt_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "aiverse_jobs"."Prompt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
