import { PaginationDto } from '../../common/pagination/pagination.dto';
import { CompaniesService } from './companies.service';
export declare class CompaniesController {
    private readonly companies;
    constructor(companies: CompaniesService);
    list(query: PaginationDto): Promise<{
        data: {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            normalizedName: string;
            slug: string;
            domain: string | null;
            website: string | null;
            logoUrl: string | null;
            description: string | null;
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    findBySlug(slug: string): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        normalizedName: string;
        slug: string;
        domain: string | null;
        website: string | null;
        logoUrl: string | null;
        description: string | null;
    }>;
    jobs(slug: string, query: PaginationDto): Promise<{
        data: ({
            company: {
                name: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                normalizedName: string;
                slug: string;
                domain: string | null;
                website: string | null;
                logoUrl: string | null;
                description: string | null;
            };
            sources: {
                provider: {
                    name: string;
                    type: string;
                };
                sourceUrl: string;
                applyUrl: string;
            }[];
            locations: {
                id: string;
                jobId: string;
                city: string | null;
                state: string | null;
                country: string | null;
                countryCode: string | null;
                latitude: number | null;
                longitude: number | null;
                isRemote: boolean;
            }[];
            skills: ({
                skill: {
                    name: string;
                    id: string;
                    normalizedName: string;
                };
            } & {
                jobId: string;
                skillId: string;
            })[];
        } & {
            id: string;
            status: import(".prisma/client").$Enums.JobStatus;
            createdAt: Date;
            updatedAt: Date;
            firstSeenAt: Date;
            lastSeenAt: Date;
            slug: string;
            description: string | null;
            companyId: string;
            title: string;
            descriptionText: string | null;
            employmentType: string | null;
            workplaceType: string | null;
            salaryMin: number | null;
            salaryMax: number | null;
            salaryCurrency: string | null;
            salaryPeriod: string | null;
            postedAt: Date | null;
            expiresAt: Date | null;
            contentHash: string;
            dedupeFingerprint: string;
            missingSyncCount: number;
        })[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
}
