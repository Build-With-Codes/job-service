import { PaginationDto } from '../../common/pagination/pagination.dto';
export declare class SearchJobsDto extends PaginationDto {
    q?: string;
    location?: string;
    country?: string;
    city?: string;
    remote?: boolean;
    employmentType?: string;
    workplaceType?: string;
    experience?: string;
    category?: string;
    company?: string;
    salaryMin?: number;
    salaryMax?: number;
    postedWithin?: number;
    sort: 'relevance' | 'newest' | 'salary';
}
