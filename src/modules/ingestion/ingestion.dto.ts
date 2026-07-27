import { IsString } from 'class-validator';

export class SyncProviderDto {
  @IsString()
  providerType!: string;
}
