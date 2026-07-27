import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import type { ListJobsDto } from './jobs.dto';
export declare const publicJobInclude: {
    company: true;
    locations: true;
    sources: {
        select: {
            sourceUrl: true;
            applyUrl: true;
            provider: {
                select: {
                    name: true;
                    type: true;
                };
            };
        };
    };
    skills: {
        include: {
            skill: true;
        };
    };
};
export declare class JobsRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
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
    findById(id: string): Prisma.Prisma__JobClient<({
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
    }) | null, null, import("@prisma/client/runtime/client").DefaultArgs, Prisma.PrismaClientOptions>;
    findBySlug(slug: string): Prisma.Prisma__JobClient<({
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
    }) | null, null, import("@prisma/client/runtime/client").DefaultArgs, Prisma.PrismaClientOptions>;
}
