"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeoService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
const defaultOgImage = 'https://aiverseworld.com/og-image.png';
function slugify(value) {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}
function titleCase(value) {
    return value
        .split(/[-_\s]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}
function truncate(value, max = 160) {
    const text = (value ?? '').replace(/\s+/g, ' ').trim();
    if (text.length <= max)
        return text;
    return `${text.slice(0, max - 1).trimEnd()}...`;
}
let SeoService = class SeoService {
    prisma;
    siteUrl = process.env.AIVERSE_SITE_URL?.trim() ||
        process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
        'https://aiverseworld.com';
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getSeo(input) {
        const type = input.type?.trim().toLowerCase();
        if (!type)
            throw new common_1.NotFoundException('SEO type is required.');
        const key = slugify(input.slug ?? input.query ?? 'index') || 'index';
        const managed = await this.findManagedSeo(type, key);
        if (managed)
            return managed;
        const generated = await (async () => {
            switch (type) {
                case 'prompt':
                    return this.getPromptSeo(input.slug);
                case 'prompts':
                    return this.getPromptsSeo();
                case 'job':
                    return this.getJobSeo(input.slug);
                case 'jobs':
                    return this.getJobsSeo();
                case 'search':
                    return this.getSearchSeo(input.query);
                default:
                    throw new common_1.NotFoundException(`Unsupported SEO type: ${type}`);
            }
        })();
        return this.completeSeo(generated);
    }
    async getSitemap(section) {
        const normalized = section.trim().toLowerCase();
        switch (normalized) {
            case 'prompts':
                return this.getPromptsSitemap();
            case 'jobs':
                return this.getJobsSitemap();
            case 'seo-pages':
            case 'pages':
                return this.getManagedPagesSitemap();
            default:
                throw new common_1.NotFoundException(`Unsupported sitemap section: ${section}`);
        }
    }
    canonical(path) {
        return new URL(path, this.siteUrl).toString();
    }
    ogImageFor(input) {
        const url = new URL(`/api/og/${input.type}/${input.slug || 'index'}`, this.siteUrl);
        url.searchParams.set('title', truncate(input.title, 90));
        url.searchParams.set('description', truncate(input.description, 170));
        if (input.kicker)
            url.searchParams.set('kicker', input.kicker);
        return url.toString();
    }
    async findManagedSeo(type, slug) {
        try {
            const page = await this.prisma.db.seoPage.findUnique({
                where: { type_slug: { type, slug } },
            });
            if (!page)
                return null;
            return this.completeSeo({
                title: page.title,
                description: page.description,
                keywords: page.keywords,
                canonical: page.canonicalUrl ?? this.canonical(`/${type}/${slug}`),
                ogTitle: page.ogTitle ?? page.title,
                ogDescription: page.ogDescription ?? page.description,
                ogImage: page.ogImage ?? this.ogImageFor({
                    type,
                    slug,
                    title: page.title,
                    description: page.description,
                }),
                twitterTitle: page.twitterTitle ?? page.ogTitle ?? page.title,
                twitterDescription: page.twitterDescription ?? page.ogDescription ?? page.description,
                robots: {
                    index: page.robotsIndex,
                    follow: page.robotsFollow,
                    archive: page.robotsArchive,
                    imageIndex: page.robotsImageIndex,
                },
                openGraph: {
                    title: page.ogTitle ?? page.title,
                    description: page.ogDescription ?? page.description,
                    image: page.ogImage ?? this.ogImageFor({
                        type,
                        slug,
                        title: page.title,
                        description: page.description,
                    }),
                    type: page.ogType,
                },
                twitter: {
                    card: page.twitterCard,
                    title: page.twitterTitle ?? page.ogTitle ?? page.title,
                    description: page.twitterDescription ?? page.ogDescription ?? page.description,
                    image: page.ogImage ?? this.ogImageFor({
                        type,
                        slug,
                        title: page.title,
                        description: page.description,
                    }),
                },
                alternates: this.objectValue(page.alternates),
                jsonLd: this.objectArrayValue(page.jsonLd),
                breadcrumb: this.breadcrumbValue(page.breadcrumb),
                seoVersion: page.seoVersion,
                seoGeneratedAt: page.seoGeneratedAt?.toISOString() ?? null,
                seoGeneratedBy: page.seoGeneratedBy,
                seoScore: page.seoScore,
                qualityScore: page.qualityScore,
                needsReview: page.needsReview,
            });
        }
        catch {
            return null;
        }
    }
    async getPromptsSitemap() {
        const rows = await this.prisma.db.prompt.findMany({
            where: { status: 'PUBLISHED' },
            select: { slug: true, lastUpdatedAt: true, updatedAt: true },
            orderBy: { lastUpdatedAt: 'desc' },
            take: 50_000,
        });
        return rows.map((prompt) => ({
            url: this.canonical(`/prompts/${prompt.slug}`),
            lastModified: (prompt.lastUpdatedAt ?? prompt.updatedAt).toISOString(),
            changeFrequency: 'weekly',
            priority: 0.75,
        }));
    }
    async getJobsSitemap() {
        const rows = await this.prisma.db.job.findMany({
            where: { status: 'ACTIVE' },
            select: { slug: true, updatedAt: true, postedAt: true },
            orderBy: { postedAt: 'desc' },
            take: 50_000,
        });
        return rows.map((job) => ({
            url: this.canonical(`/jobs/${job.slug}`),
            lastModified: (job.postedAt ?? job.updatedAt).toISOString(),
            changeFrequency: 'daily',
            priority: 0.7,
        }));
    }
    async getManagedPagesSitemap() {
        const rows = await this.prisma.db.seoPage.findMany({
            where: { robotsIndex: true },
            select: { type: true, slug: true, canonicalUrl: true, updatedAt: true },
            orderBy: { updatedAt: 'desc' },
            take: 50_000,
        });
        return rows.map((page) => ({
            url: page.canonicalUrl ?? this.canonical(`/${page.type}/${page.slug}`),
            lastModified: page.updatedAt.toISOString(),
            changeFrequency: 'weekly',
            priority: 0.65,
        }));
    }
    completeSeo(payload) {
        const ogTitle = payload.openGraph?.title ?? payload.ogTitle ?? payload.title;
        const ogDescription = payload.openGraph?.description ?? payload.ogDescription ?? payload.description;
        const ogImage = payload.openGraph?.image ?? payload.ogImage ?? defaultOgImage;
        const twitterTitle = payload.twitter?.title ?? payload.twitterTitle ?? ogTitle;
        const twitterDescription = payload.twitter?.description ?? payload.twitterDescription ?? ogDescription;
        return {
            ...payload,
            robots: payload.robots ?? { index: true, follow: true },
            openGraph: payload.openGraph ?? {
                title: ogTitle,
                description: ogDescription,
                image: ogImage,
                type: 'website',
            },
            twitter: payload.twitter ?? {
                card: 'summary_large_image',
                title: twitterTitle,
                description: twitterDescription,
                image: ogImage,
            },
            jsonLd: payload.jsonLd ?? [this.webPageJsonLd(payload.title, payload.description, payload.canonical)],
            breadcrumb: payload.breadcrumb ?? [{ name: 'AiverseWorld', url: this.siteUrl }],
            seoVersion: payload.seoVersion ?? 1,
            seoGeneratedAt: payload.seoGeneratedAt ?? null,
            seoGeneratedBy: payload.seoGeneratedBy ?? 'computed-fallback',
            seoScore: payload.seoScore ?? this.scoreSeo(payload),
            qualityScore: payload.qualityScore ?? null,
            needsReview: payload.needsReview ?? false,
        };
    }
    webPageJsonLd(title, description, canonical) {
        return {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: title,
            description,
            url: canonical,
            isPartOf: {
                '@type': 'WebSite',
                name: 'AiverseWorld',
                url: this.siteUrl,
            },
        };
    }
    scoreSeo(payload) {
        let score = 0;
        if (payload.title.length >= 30 && payload.title.length <= 70)
            score += 25;
        if (payload.description.length >= 120 && payload.description.length <= 170)
            score += 25;
        if (payload.keywords.length >= 3)
            score += 15;
        if (payload.canonical)
            score += 15;
        if (payload.ogImage || payload.openGraph?.image)
            score += 10;
        if (payload.robots?.index !== false)
            score += 10;
        return Math.min(score, 100);
    }
    objectValue(value) {
        return value && typeof value === 'object' && !Array.isArray(value)
            ? value
            : undefined;
    }
    objectArrayValue(value) {
        return Array.isArray(value) ? value.filter((item) => item && typeof item === 'object') : undefined;
    }
    breadcrumbValue(value) {
        if (!Array.isArray(value))
            return undefined;
        return value
            .filter((item) => item && typeof item === 'object')
            .map((item) => item)
            .filter((item) => typeof item.name === 'string' && typeof item.url === 'string')
            .map((item) => ({ name: item.name, url: item.url }));
    }
    async getPromptSeo(slug) {
        if (!slug)
            throw new common_1.NotFoundException('Prompt slug is required.');
        const prompt = await this.prisma.db.prompt.findUnique({
            where: { slug },
            include: { categories: true, tags: true },
        });
        if (!prompt)
            throw new common_1.NotFoundException('Prompt SEO not found.');
        const categories = prompt.categories.map((category) => category.name);
        const tags = prompt.tags.map((tag) => tag.name);
        return {
            title: prompt.seoTitle ?? `${prompt.title} | AI Prompt Workspace`,
            description: prompt.seoDescription ?? truncate(prompt.description),
            keywords: [
                ...prompt.seoKeywords,
                prompt.title,
                prompt.promptType,
                prompt.difficulty,
                ...prompt.supportedModels,
                ...categories,
                ...tags,
            ].filter(Boolean),
            canonical: prompt.canonicalUrl ?? this.canonical(`/prompts/${prompt.slug}`),
            ogTitle: prompt.title,
            ogDescription: truncate(prompt.description),
            ogImage: prompt.ogImage ?? this.ogImageFor({
                type: 'prompt',
                slug: prompt.slug,
                title: prompt.title,
                description: prompt.description,
                kicker: prompt.promptType,
            }),
        };
    }
    getPromptsSeo() {
        return {
            title: 'AI Prompt Workspace | Search, Copy & Save Prompts',
            description: 'Search, copy, save, and customize production-ready prompts for marketing, coding, support, content, and AI agents.',
            keywords: ['AI prompts', 'prompt library', 'prompt engineering', 'ChatGPT prompts', 'Claude prompts'],
            canonical: this.canonical('/prompts'),
            ogImage: this.ogImageFor({
                type: 'prompts',
                slug: 'index',
                title: 'AI Prompt Workspace',
                description: 'Search, copy, save, and customize production-ready prompts for marketing, coding, support, content, and AI agents.',
                kicker: 'Prompt Workspace',
            }),
        };
    }
    async getJobSeo(slug) {
        if (!slug)
            throw new common_1.NotFoundException('Job slug is required.');
        const job = await this.prisma.db.job.findUnique({
            where: { slug },
            include: { company: true, locations: true, skills: { include: { skill: true } } },
        });
        if (!job)
            throw new common_1.NotFoundException('Job SEO not found.');
        const location = job.locations
            .map((item) => item.isRemote ? 'Remote' : [item.city, item.state, item.country].filter(Boolean).join(', '))
            .filter(Boolean)[0];
        const skills = job.skills.map((item) => item.skill.name);
        return {
            title: `${job.title} at ${job.company.name} | AI Jobs`,
            description: truncate(`${job.company.name} is hiring ${job.title}${location ? ` in ${location}` : ''}. ${job.descriptionText ?? ''}`),
            keywords: [job.title, job.company.name, location, ...skills, 'AI jobs', 'machine learning jobs'].filter(Boolean),
            canonical: this.canonical(`/jobs/${job.slug}`),
            ogImage: this.ogImageFor({
                type: 'job',
                slug: job.slug,
                title: `${job.title} at ${job.company.name}`,
                description: `${job.company.name} is hiring ${job.title}${location ? ` in ${location}` : ''}.`,
                kicker: 'AI Job',
            }),
        };
    }
    getJobsSeo() {
        return {
            title: 'AI Jobs | AiverseWorld',
            description: 'Search live AI, ML, data science, LLM, cloud, security, product, and automation roles from employer-backed job feeds.',
            keywords: ['AI jobs', 'machine learning jobs', 'LLM jobs', 'data science jobs', 'remote AI jobs'],
            canonical: this.canonical('/jobs'),
            ogImage: this.ogImageFor({
                type: 'jobs',
                slug: 'index',
                title: 'AI Jobs',
                description: 'Search live AI, ML, data science, LLM, cloud, security, product, and automation roles from employer-backed job feeds.',
                kicker: 'AI Jobs',
            }),
        };
    }
    getSearchSeo(query) {
        const q = query?.trim();
        return {
            title: q ? `${titleCase(q)} AI Jobs | AiverseWorld` : 'Search AI Jobs | AiverseWorld',
            description: q
                ? `Search current ${q} jobs across AI, machine learning, software, data, cloud, security, and product teams.`
                : 'Search live AI and future technology roles by skill, company, location, remote mode, and seniority.',
            keywords: q ? [q, `${q} jobs`, 'AI jobs', 'remote AI jobs'] : ['AI job search', 'AI jobs'],
            canonical: this.canonical(q ? `/jobs?q=${encodeURIComponent(q)}` : '/jobs'),
            ogImage: this.ogImageFor({
                type: 'jobs',
                slug: q ? slugify(q) : 'search',
                title: q ? `${titleCase(q)} AI Jobs` : 'Search AI Jobs',
                description: q
                    ? `Search current ${q} jobs across AI, machine learning, software, data, cloud, security, and product teams.`
                    : 'Search live AI and future technology roles by skill, company, location, remote mode, and seniority.',
                kicker: 'AI Jobs',
            }),
        };
    }
};
exports.SeoService = SeoService;
exports.SeoService = SeoService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SeoService);
//# sourceMappingURL=seo.service.js.map