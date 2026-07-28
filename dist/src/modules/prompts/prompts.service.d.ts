import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import type { SearchPromptsDto } from './prompts.dto';
export declare class PromptsService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    search(input: SearchPromptsDto): Promise<{
        data: ({
            sources: {
                id: string;
                sourceUrl: string | null;
                contentHash: string;
                promptId: string;
                sourceType: string;
                sourceName: string;
                fetchedAt: Date;
            }[];
            versions: {
                id: string;
                createdAt: Date;
                prompt: string;
                promptId: string;
                version: number;
                notes: string | null;
            }[];
            categories: {
                name: string;
                id: string;
                slug: string;
                promptId: string;
            }[];
            tags: {
                name: string;
                id: string;
                slug: string;
                promptId: string;
            }[];
            stats: {
                updatedAt: Date;
                promptId: string;
                views: number;
                copies: number;
                saves: number;
                likes: number;
                shares: number;
                reports: number;
                weeklyGrowth: number;
                lastViewedAt: Date | null;
            } | null;
        } & {
            id: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            sourceUrl: string | null;
            prompt: string;
            slug: string;
            description: string;
            title: string;
            canonicalUrl: string | null;
            ogImage: string | null;
            qualityScore: number;
            promptType: string;
            difficulty: string;
            authorName: string | null;
            license: string | null;
            supportedModels: string[];
            variables: Prisma.JsonValue | null;
            exampleInput: Prisma.JsonValue | null;
            exampleOutput: string | null;
            seoTitle: string | null;
            seoDescription: string | null;
            seoKeywords: string[];
            readabilityScore: number;
            structureScore: number;
            variablesScore: number;
            reusabilityScore: number;
            featured: boolean;
            trendingScore: number;
            publishedAt: Date;
            lastUpdatedAt: Date;
        } & {
            seo: {
                title: string;
                description: string;
                keywords: string[];
                canonical: string;
                ogImage: string;
            };
        })[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    private hybridSearch;
    findBySlug(slug: string): Promise<({
        sources: {
            id: string;
            sourceUrl: string | null;
            contentHash: string;
            promptId: string;
            sourceType: string;
            sourceName: string;
            fetchedAt: Date;
        }[];
        versions: {
            id: string;
            createdAt: Date;
            prompt: string;
            promptId: string;
            version: number;
            notes: string | null;
        }[];
        categories: {
            name: string;
            id: string;
            slug: string;
            promptId: string;
        }[];
        tags: {
            name: string;
            id: string;
            slug: string;
            promptId: string;
        }[];
        stats: {
            updatedAt: Date;
            promptId: string;
            views: number;
            copies: number;
            saves: number;
            likes: number;
            shares: number;
            reports: number;
            weeklyGrowth: number;
            lastViewedAt: Date | null;
        } | null;
    } & {
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        sourceUrl: string | null;
        prompt: string;
        slug: string;
        description: string;
        title: string;
        canonicalUrl: string | null;
        ogImage: string | null;
        qualityScore: number;
        promptType: string;
        difficulty: string;
        authorName: string | null;
        license: string | null;
        supportedModels: string[];
        variables: Prisma.JsonValue | null;
        exampleInput: Prisma.JsonValue | null;
        exampleOutput: string | null;
        seoTitle: string | null;
        seoDescription: string | null;
        seoKeywords: string[];
        readabilityScore: number;
        structureScore: number;
        variablesScore: number;
        reusabilityScore: number;
        featured: boolean;
        trendingScore: number;
        publishedAt: Date;
        lastUpdatedAt: Date;
    } & {
        seo: {
            title: string;
            description: string;
            keywords: string[];
            canonical: string;
            ogImage: string;
        };
    }) | null>;
    getSaved(userKey: string): Promise<({
        sources: {
            id: string;
            sourceUrl: string | null;
            contentHash: string;
            promptId: string;
            sourceType: string;
            sourceName: string;
            fetchedAt: Date;
        }[];
        versions: {
            id: string;
            createdAt: Date;
            prompt: string;
            promptId: string;
            version: number;
            notes: string | null;
        }[];
        categories: {
            name: string;
            id: string;
            slug: string;
            promptId: string;
        }[];
        tags: {
            name: string;
            id: string;
            slug: string;
            promptId: string;
        }[];
        stats: {
            updatedAt: Date;
            promptId: string;
            views: number;
            copies: number;
            saves: number;
            likes: number;
            shares: number;
            reports: number;
            weeklyGrowth: number;
            lastViewedAt: Date | null;
        } | null;
    } & {
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        sourceUrl: string | null;
        prompt: string;
        slug: string;
        description: string;
        title: string;
        canonicalUrl: string | null;
        ogImage: string | null;
        qualityScore: number;
        promptType: string;
        difficulty: string;
        authorName: string | null;
        license: string | null;
        supportedModels: string[];
        variables: Prisma.JsonValue | null;
        exampleInput: Prisma.JsonValue | null;
        exampleOutput: string | null;
        seoTitle: string | null;
        seoDescription: string | null;
        seoKeywords: string[];
        readabilityScore: number;
        structureScore: number;
        variablesScore: number;
        reusabilityScore: number;
        featured: boolean;
        trendingScore: number;
        publishedAt: Date;
        lastUpdatedAt: Date;
    } & {
        seo: {
            title: string;
            description: string;
            keywords: string[];
            canonical: string;
            ogImage: string;
        };
    })[]>;
    savePrompt(userKey: string, promptId: string): Promise<{
        saved: boolean;
    }>;
    unsavePrompt(userKey: string, promptId: string): Promise<{
        saved: boolean;
    }>;
    recordEvent(slug: string, type: 'copy' | 'view' | 'share', input?: {
        visitorKey?: string;
        idempotencyKey?: string;
    }): Promise<{
        counted: boolean;
        stats: {
            updatedAt: Date;
            promptId: string;
            views: number;
            copies: number;
            saves: number;
            likes: number;
            shares: number;
            reports: number;
            weeklyGrowth: number;
            lastViewedAt: Date | null;
        } | null;
    }>;
    stats(): Promise<{
        total: number;
        categories: {
            slug: string;
            name: string;
            count: number;
        }[];
        models: {
            name: string;
            count: number;
        }[];
        suggestions: string[];
        copies: number;
        saves: number;
        views: number;
    }>;
    private buildPromptSuggestions;
    syncFromConfiguredSources(): Promise<{
        sources: number;
        promptsFound: number;
        promptsSaved: number;
    }>;
    reprocessExistingPrompts(limit?: number): Promise<{
        requested: number;
        processed: number;
    }>;
    private buildHybridFilterSql;
    private buildHybridOrderSql;
    private expandPromptSearchQuery;
    private buildWhere;
    private buildOrder;
    private parsePromptFeed;
    private getConfiguredSources;
    private inferSourceType;
    private fetchSourcePrompts;
    private fetchGithubSearchPrompts;
    private fetchGithubRepoPrompts;
    private fetchJson;
    private fetchText;
    private parseCsvPrompts;
    private parseCsvRows;
    private extractPromptLikeBlocks;
    private modelsForSource;
    private maxPromptsPerSource;
    private processPromptCandidate;
    private findNearestPrompt;
    private textSimilarityPercent;
    private weightedTokenMap;
    private comparePromptIntentWithAi;
    private processPromptWithAi;
    private buildFallbackProcessedPrompt;
    private callOpenRouterJson;
    private resolveOpenRouterChatUrl;
    private cleanJsonContent;
    private withTimeout;
    private truncate;
    private clampPercent;
    private defaultEventKey;
    private upsertPrompt;
    private buildPromptSeo;
    private withPromptSeo;
    private stringValue;
    private stringArray;
    private numberValue;
    private objectValue;
    private slugify;
}
