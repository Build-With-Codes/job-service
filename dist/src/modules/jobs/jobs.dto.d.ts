import { PaginationDto } from '../../common/pagination/pagination.dto';
export declare class ListJobsDto extends PaginationDto {
    company?: string;
    category?: string;
    employmentType?: string;
    country?: string;
    remote?: boolean;
    sort: 'newest' | 'oldest' | 'updated';
}
