import { Injectable } from '@nestjs/common';
import { SearchRepository } from './search.repository';
import type { SearchJobsDto } from './search.dto';

@Injectable()
export class SearchService {
  constructor(private readonly searchRepository: SearchRepository) {}

  search(input: SearchJobsDto) {
    return this.searchRepository.search(input);
  }
}
