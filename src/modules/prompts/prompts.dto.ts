import { IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../common/pagination/pagination.dto';

export class SearchPromptsDto extends PaginationDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  difficulty?: string;

  @IsOptional()
  @IsString()
  promptType?: string;

  @IsOptional()
  @IsIn(['featured', 'trending', 'latest', 'saved', 'used', 'recommended'])
  tab?: string;

  @IsOptional()
  @IsIn(['relevance', 'featured', 'trending', 'latest', 'saved', 'used', 'quality'])
  sort?: string;
}
