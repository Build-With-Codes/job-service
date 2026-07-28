import { SeoService } from './seo.service';
export declare class SeoController {
    private readonly seoService;
    constructor(seoService: SeoService);
    getSeo(type?: string, slug?: string, query?: string): Promise<{
        data: {
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
    }>;
    getSitemap(section: string): Promise<{
        data: {
            url: string;
            lastModified: string;
            changeFrequency: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
            priority: number;
        }[];
    }>;
}
