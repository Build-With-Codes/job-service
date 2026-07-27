import { SearchPromptsDto } from './prompts.dto';
import { PromptsService } from './prompts.service';
export declare class PromptsController {
    private readonly prompts;
    constructor(prompts: PromptsService);
    search(query: SearchPromptsDto): Promise<{
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
            promptType: string;
            difficulty: string;
            authorName: string | null;
            license: string | null;
            supportedModels: string[];
            variables: import("@prisma/client/runtime/client").JsonValue | null;
            exampleInput: import("@prisma/client/runtime/client").JsonValue | null;
            exampleOutput: string | null;
            qualityScore: number;
            readabilityScore: number;
            structureScore: number;
            variablesScore: number;
            reusabilityScore: number;
            featured: boolean;
            trendingScore: number;
            publishedAt: Date;
            lastUpdatedAt: Date;
        })[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
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
    saved(headers: Record<string, string | string[] | undefined>, userId?: string): Promise<{
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
            promptType: string;
            difficulty: string;
            authorName: string | null;
            license: string | null;
            supportedModels: string[];
            variables: import("@prisma/client/runtime/client").JsonValue | null;
            exampleInput: import("@prisma/client/runtime/client").JsonValue | null;
            exampleOutput: string | null;
            qualityScore: number;
            readabilityScore: number;
            structureScore: number;
            variablesScore: number;
            reusabilityScore: number;
            featured: boolean;
            trendingScore: number;
            publishedAt: Date;
            lastUpdatedAt: Date;
        })[];
    }>;
    save(headers: Record<string, string | string[] | undefined>, body: {
        userId?: string;
        promptId?: string;
    }): Promise<{
        data: {
            saved: boolean;
        };
    }>;
    unsave(headers: Record<string, string | string[] | undefined>, userId?: string, promptId?: string): Promise<{
        data: {
            saved: boolean;
        };
    }>;
    sync(): Promise<{
        sources: number;
        promptsFound: number;
        promptsSaved: number;
    }>;
    reprocess(limit?: string): Promise<{
        requested: number;
        processed: number;
    }>;
    recordEvent(slug: string, body: {
        type?: string;
        visitorKey?: string;
        idempotencyKey?: string;
    }): Promise<{
        data: {
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
        };
    }>;
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
        promptType: string;
        difficulty: string;
        authorName: string | null;
        license: string | null;
        supportedModels: string[];
        variables: import("@prisma/client/runtime/client").JsonValue | null;
        exampleInput: import("@prisma/client/runtime/client").JsonValue | null;
        exampleOutput: string | null;
        qualityScore: number;
        readabilityScore: number;
        structureScore: number;
        variablesScore: number;
        reusabilityScore: number;
        featured: boolean;
        trendingScore: number;
        publishedAt: Date;
        lastUpdatedAt: Date;
    }) | null>;
}
