export declare class PaginationDto {
    page: number;
    limit: number;
}
export declare function paginate(page?: number, limit?: number): {
    skip: number;
    take: number;
    page: number;
    limit: number;
};
