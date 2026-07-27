import type { ListJobsDto } from './jobs.dto';
import { JobsRepository } from './jobs.repository';
export declare class JobsService {
    private readonly jobs;
    constructor(jobs: JobsRepository);
    list(input: ListJobsDto): Promise<{
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
    findById(id: string): Promise<{
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
    }>;
    findBySlug(slug: string): Promise<{
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
    }>;
}
