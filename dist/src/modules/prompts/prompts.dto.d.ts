import { PaginationDto } from '../../common/pagination/pagination.dto';
export declare class SearchPromptsDto extends PaginationDto {
    q?: string;
    category?: string;
    model?: string;
    difficulty?: string;
    promptType?: string;
    tab?: string;
    sort?: string;
}
