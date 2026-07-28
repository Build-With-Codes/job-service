import { PrismaService } from '../../database/prisma.service';
type SeoInput = {
    type?: string;
    slug?: string;
    query?: string;
};
type SeoPayload = {
    title: string;
    description: string;
    keywords: string[];
    canonical: string;
    openGraph?: {
        title: string;
        description: string;
        image?: string;
        type?: string;
    };
    twitter?: {
        card: string;
        title: string;
        description: string;
        image?: string;
    };
    alternates?: {
        languages?: Record<string, string>;
    };
    jsonLd?: object[];
    breadcrumb?: Array<{
        name: string;
        url: string;
    }>;
    seoVersion?: number;
    seoGeneratedAt?: string | null;
    seoGeneratedBy?: string | null;
    seoScore?: number | null;
    qualityScore?: number | null;
    needsReview?: boolean;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    twitterTitle?: string;
    twitterDescription?: string;
    robots?: {
        index: boolean;
        follow: boolean;
        archive?: boolean;
        imageIndex?: boolean;
    };
};
type SitemapEntry = {
    url: string;
    lastModified: string;
    changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
    priority: number;
};
export declare class SeoService {
    private readonly prisma;
    private readonly siteUrl;
    constructor(prisma: PrismaService);
    getSeo(input: SeoInput): Promise<SeoPayload>;
    getSitemap(section: string): Promise<SitemapEntry[]>;
    private canonical;
    private ogImageFor;
    private findManagedSeo;
    private getPromptsSitemap;
    private getJobsSitemap;
    private getManagedPagesSitemap;
    private completeSeo;
    private webPageJsonLd;
    private scoreSeo;
    private objectValue;
    private objectArrayValue;
    private breadcrumbValue;
    private getPromptSeo;
    private getPromptsSeo;
    private getJobSeo;
    private getJobsSeo;
    private getSearchSeo;
}
export {};
