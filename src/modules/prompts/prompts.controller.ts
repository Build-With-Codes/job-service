import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SearchPromptsDto } from './prompts.dto';
import { PromptsService } from './prompts.service';

function assertInternal(headers: Record<string, string | string[] | undefined>) {
  const configuredKey = process.env.INTERNAL_API_KEY?.trim();
  if (!configuredKey) {
    if (process.env.NODE_ENV === 'production') {
      throw new UnauthorizedException('INTERNAL_API_KEY is not configured.');
    }
    return;
  }

  const rawKey = headers['x-internal-api-key'];
  const key = Array.isArray(rawKey) ? rawKey[0] : rawKey;
  if (key !== configuredKey) {
    throw new UnauthorizedException('Invalid internal API key.');
  }
}

function requireUserId(userId?: string) {
  const trimmed = userId?.trim();
  if (!trimmed) throw new BadRequestException('userId is required.');
  return trimmed;
}

@ApiTags('prompts')
@Controller('prompts')
export class PromptsController {
  constructor(private readonly prompts: PromptsService) {}

  @Get()
  search(@Query() query: SearchPromptsDto) {
    return this.prompts.search(query);
  }

  @Get('stats')
  stats() {
    return this.prompts.stats();
  }

  @Get('me/saved')
  async saved(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query('userId') userId?: string,
  ) {
    assertInternal(headers);
    return { data: await this.prompts.getSaved(requireUserId(userId)) };
  }

  @Post('me/saved')
  async save(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() body: { userId?: string; promptId?: string },
  ) {
    assertInternal(headers);
    if (!body?.promptId?.trim()) throw new BadRequestException('promptId is required.');
    return { data: await this.prompts.savePrompt(requireUserId(body.userId), body.promptId.trim()) };
  }

  @Delete('me/saved')
  async unsave(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query('userId') userId?: string,
    @Query('promptId') promptId?: string,
  ) {
    assertInternal(headers);
    if (!promptId?.trim()) throw new BadRequestException('promptId is required.');
    return { data: await this.prompts.unsavePrompt(requireUserId(userId), promptId.trim()) };
  }

  @Post('sync')
  sync() {
    return this.prompts.syncFromConfiguredSources();
  }

  @Post('reprocess')
  reprocess(@Query('limit') limit?: string) {
    return this.prompts.reprocessExistingPrompts(limit ? Number(limit) : 25);
  }

  @Post(':slug/events')
  async recordEvent(
    @Param('slug') slug: string,
    @Body() body: { type?: string; visitorKey?: string; idempotencyKey?: string },
  ) {
    if (body?.type !== 'copy' && body?.type !== 'view' && body?.type !== 'share') {
      throw new BadRequestException('Supported prompt event types: copy, view, share.');
    }
    return {
      data: await this.prompts.recordEvent(slug, body.type, {
        visitorKey: body.visitorKey,
        idempotencyKey: body.idempotencyKey,
      }),
    };
  }

  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.prompts.findBySlug(slug);
  }
}
