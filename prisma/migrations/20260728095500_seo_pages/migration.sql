CREATE TABLE "aiverse_jobs"."SeoPage" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "keywords" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "canonicalUrl" TEXT,
    "ogTitle" TEXT,
    "ogDescription" TEXT,
    "ogImage" TEXT,
    "ogType" TEXT NOT NULL DEFAULT 'website',
    "twitterTitle" TEXT,
    "twitterDescription" TEXT,
    "twitterCard" TEXT NOT NULL DEFAULT 'summary_large_image',
    "alternates" JSONB,
    "jsonLd" JSONB,
    "breadcrumb" JSONB,
    "robotsIndex" BOOLEAN NOT NULL DEFAULT true,
    "robotsFollow" BOOLEAN NOT NULL DEFAULT true,
    "robotsArchive" BOOLEAN NOT NULL DEFAULT true,
    "robotsImageIndex" BOOLEAN NOT NULL DEFAULT true,
    "seoVersion" INTEGER NOT NULL DEFAULT 1,
    "seoGeneratedAt" TIMESTAMP(3),
    "seoGeneratedBy" TEXT,
    "seoScore" INTEGER,
    "qualityScore" INTEGER,
    "needsReview" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeoPage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SeoPage_type_slug_key" ON "aiverse_jobs"."SeoPage"("type", "slug");
CREATE INDEX "SeoPage_type_idx" ON "aiverse_jobs"."SeoPage"("type");
