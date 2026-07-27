import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHash } from 'node:crypto';
import { paginate } from '../../common/pagination/pagination.dto';
import { PrismaService } from '../../database/prisma.service';
import { DEFAULT_PROMPT_SOURCES, type PromptSourceConfig, type PromptSourceType } from './prompt-sources';
import type { SearchPromptsDto } from './prompts.dto';

const promptInclude = {
  categories: true,
  tags: true,
  stats: true,
  sources: true,
  versions: { orderBy: { version: 'desc' as const }, take: 5 },
};

type PromptCandidate = Record<string, unknown>;

type ExistingPromptForSimilarity = {
  id: string;
  slug: string;
  title: string;
  prompt: string;
};

type PromptProcessingResult =
  | { action: 'skip'; reason: string; similarity: number }
  | { action: 'save'; prompt: PromptCandidate; similarity: number };

type AiProcessedPrompt = {
  title?: string;
  description?: string;
  prompt?: string;
  promptType?: string;
  difficulty?: string;
  categories?: string[];
  tags?: string[];
  supportedModels?: string[];
  qualityScore?: number;
  readabilityScore?: number;
  structureScore?: number;
  variablesScore?: number;
  reusabilityScore?: number;
  featured?: boolean;
  trendingScore?: number;
  variables?: Record<string, string>;
  exampleInput?: Record<string, string>;
  exampleOutput?: string;
};

@Injectable()
export class PromptsService {
  private readonly logger = new Logger(PromptsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async search(input: SearchPromptsDto) {
    const { skip, take, page, limit } = paginate(input.page, input.limit);
    if (input.q?.trim()) {
      return this.hybridSearch(input, { skip, take, page, limit });
    }

    const where = this.buildWhere(input);
    const orderBy = this.buildOrder(input);

    const [total, data] = await Promise.all([
      this.prisma.db.prompt.count({ where }),
      this.prisma.db.prompt.findMany({
        where,
        include: promptInclude,
        skip,
        take,
        orderBy,
      }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } };
  }

  private async hybridSearch(
    input: SearchPromptsDto,
    pagination: { skip: number; take: number; page: number; limit: number },
  ) {
    const q = input.q?.trim() ?? '';
    const semanticQuery = this.expandPromptSearchQuery(q);
    const filterSql = this.buildHybridFilterSql(input);
    const orderSql = this.buildHybridOrderSql(input);

    const rows = await this.prisma.db.$queryRaw<Array<{ id: string; total: bigint | number }>>`
      WITH prompt_docs AS (
        SELECT
          p."id",
          p."qualityScore",
          p."trendingScore",
          p."featured",
          p."publishedAt",
          COALESCE(s."copies", 0) AS "copies",
          COALESCE(s."saves", 0) AS "saves",
          CONCAT_WS(
            ' ',
            p."title",
            p."description",
            p."prompt",
            p."promptType",
            p."difficulty",
            ARRAY_TO_STRING(p."supportedModels", ' '),
            COALESCE(STRING_AGG(DISTINCT pc."name", ' '), ''),
            COALESCE(STRING_AGG(DISTINCT pt."name", ' '), '')
          ) AS doc
        FROM "aiverse_jobs"."Prompt" p
        LEFT JOIN "aiverse_jobs"."PromptStat" s ON s."promptId" = p."id"
        LEFT JOIN "aiverse_jobs"."PromptCategory" pc ON pc."promptId" = p."id"
        LEFT JOIN "aiverse_jobs"."PromptTag" pt ON pt."promptId" = p."id"
        WHERE ${filterSql}
        GROUP BY p."id", s."copies", s."saves"
      ),
      ranked AS (
        SELECT
          "id",
          (
            TS_RANK_CD(TO_TSVECTOR('english', doc), WEBSEARCH_TO_TSQUERY('english', ${semanticQuery})) * 9
            + GREATEST(
                SIMILARITY(LOWER(doc), LOWER(${q})),
                WORD_SIMILARITY(LOWER(${q}), LOWER(doc))
              ) * 6
            + CASE WHEN LOWER(doc) LIKE '%' || LOWER(${q}) || '%' THEN 3 ELSE 0 END
            + ("qualityScore"::float / 100)
            + LEAST("trendingScore"::float / 100, 1)
          ) AS rank_score,
          "qualityScore",
          "trendingScore",
          "featured",
          "publishedAt",
          "copies",
          "saves"
        FROM prompt_docs
        WHERE
          TO_TSVECTOR('english', doc) @@ WEBSEARCH_TO_TSQUERY('english', ${semanticQuery})
          OR LOWER(doc) LIKE '%' || LOWER(${q}) || '%'
          OR WORD_SIMILARITY(LOWER(${q}), LOWER(doc)) >= 0.18
          OR SIMILARITY(LOWER(doc), LOWER(${q})) >= 0.08
      )
      SELECT "id", COUNT(*) OVER() AS total
      FROM ranked
      ORDER BY ${orderSql}
      OFFSET ${pagination.skip}
      LIMIT ${pagination.take}
    `;

    const ids = rows.map((row) => row.id);
    const total = rows.length > 0 ? Number(rows[0].total) : 0;
    const prompts = ids.length
      ? await this.prisma.db.prompt.findMany({ where: { id: { in: ids } }, include: promptInclude })
      : [];
    const byId = new Map(prompts.map((prompt) => [prompt.id, prompt]));
    const data = ids.map((id) => byId.get(id)).filter(Boolean);

    return {
      data,
      meta: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / pagination.limit)),
      },
    };
  }

  async findBySlug(slug: string) {
    return this.prisma.db.prompt.findUnique({
      where: { slug },
      include: promptInclude,
    });
  }

  async getSaved(userKey: string) {
    const saved = await this.prisma.db.promptFavorite.findMany({
      where: { userKey },
      include: { prompt: { include: promptInclude } },
      orderBy: { createdAt: 'desc' },
    });
    return saved.map((item) => item.prompt);
  }

  async savePrompt(userKey: string, promptId: string) {
    const existing = await this.prisma.db.promptFavorite.findUnique({
      where: { promptId_userKey: { promptId, userKey } },
    });
    if (existing) return { saved: true };

    await this.prisma.db.$transaction([
      this.prisma.db.promptFavorite.create({ data: { promptId, userKey } }),
      this.prisma.db.promptStat.upsert({
        where: { promptId },
        create: { promptId, views: 0, copies: 0, saves: 1, likes: 0 },
        update: { saves: { increment: 1 } },
      }),
    ]);
    return { saved: true };
  }

  async unsavePrompt(userKey: string, promptId: string) {
    const deleted = await this.prisma.db.promptFavorite.deleteMany({ where: { promptId, userKey } });
    if (deleted.count > 0) {
      await this.prisma.db.promptStat.updateMany({
        where: { promptId, saves: { gt: 0 } },
        data: { saves: { decrement: 1 } },
      });
    }
    return { saved: false };
  }

  async recordEvent(
    slug: string,
    type: 'copy' | 'view' | 'share',
    input: { visitorKey?: string; idempotencyKey?: string } = {},
  ) {
    const prompt = await this.prisma.db.prompt.findUnique({ where: { slug }, select: { id: true } });
    if (!prompt) throw new Error('Prompt not found.');
    const visitorKey = this.stringValue(input.visitorKey).slice(0, 120) || null;
    const idempotencyKey = this.stringValue(input.idempotencyKey).slice(0, 180) || this.defaultEventKey(type, visitorKey);

    try {
      const stats = await this.prisma.db.$transaction(async (tx) => {
        await tx.promptEvent.create({
          data: { promptId: prompt.id, eventType: type, visitorKey, idempotencyKey },
        });
        return tx.promptStat.upsert({
          where: { promptId: prompt.id },
          create: {
            promptId: prompt.id,
            views: type === 'view' ? 1 : 0,
            copies: type === 'copy' ? 1 : 0,
            shares: type === 'share' ? 1 : 0,
            saves: 0,
            likes: 0,
            lastViewedAt: type === 'view' ? new Date() : undefined,
          },
          update: type === 'copy'
            ? { copies: { increment: 1 } }
            : type === 'share'
              ? { shares: { increment: 1 } }
              : { views: { increment: 1 }, lastViewedAt: new Date() },
        });
      });
      return { counted: true, stats };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const stats = await this.prisma.db.promptStat.findUnique({ where: { promptId: prompt.id } });
        return { counted: false, stats };
      }
      throw error;
    }
  }

  async stats() {
    const [total, categories, tags, models, promptSamples, aggregate] = await Promise.all([
      this.prisma.db.prompt.count({ where: { status: 'PUBLISHED' } }),
      this.prisma.db.promptCategory.groupBy({
        by: ['slug', 'name'],
        where: { prompt: { status: 'PUBLISHED' } },
        _count: { _all: true },
        orderBy: { _count: { slug: 'desc' } },
        take: 10,
      }),
      this.prisma.db.promptTag.groupBy({
        by: ['slug', 'name'],
        where: { prompt: { status: 'PUBLISHED' } },
        _count: { _all: true },
        orderBy: { _count: { slug: 'desc' } },
        take: 18,
      }),
      this.prisma.db.prompt.findMany({ where: { status: 'PUBLISHED' }, select: { supportedModels: true } }),
      this.prisma.db.prompt.findMany({
        where: { status: 'PUBLISHED' },
        select: {
          title: true,
          promptType: true,
          supportedModels: true,
          categories: { select: { name: true } },
          tags: { select: { name: true } },
        },
        orderBy: [{ featured: 'desc' }, { qualityScore: 'desc' }, { trendingScore: 'desc' }],
        take: 24,
      }),
      this.prisma.db.promptStat.aggregate({ _sum: { copies: true, saves: true, views: true } }),
    ]);

    const modelCounts = new Map<string, number>();
    for (const prompt of models) {
      for (const model of prompt.supportedModels) {
        modelCounts.set(model, (modelCounts.get(model) ?? 0) + 1);
      }
    }
    return {
      total,
      categories: categories
        .map((category) => ({ slug: category.slug, name: category.name, count: category._count._all }))
        .filter((category) => category.count > 0)
        .sort((a, b) => b.count - a.count),
      models: [...modelCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, count]) => ({ name, count })),
      suggestions: this.buildPromptSuggestions(
        categories.map((category) => category.name),
        tags.map((tag) => tag.name),
        promptSamples,
      ),
      copies: aggregate._sum.copies ?? 0,
      saves: aggregate._sum.saves ?? 0,
      views: aggregate._sum.views ?? 0,
    };
  }

  private buildPromptSuggestions(
    categories: string[],
    tags: string[],
    prompts: Array<{
      title: string;
      promptType: string;
      supportedModels: string[];
      categories: Array<{ name: string }>;
      tags: Array<{ name: string }>;
    }>,
  ) {
    const suggestions: string[] = [];
    const seen = new Set<string>();
    const blocked = new Set(['prompt', 'prompts', 'template', 'templates', 'ai', 'system prompt', 'user prompt']);

    const add = (value: string) => {
      const cleaned = value
        .replace(/\s+/g, ' ')
        .replace(/\bprompt prompt\b/gi, 'prompt')
        .trim();
      const key = cleaned.toLowerCase();
      if (!key || key.length < 3 || key.length > 48 || blocked.has(key) || seen.has(key)) return;
      seen.add(key);
      suggestions.push(cleaned);
    };

    for (const prompt of prompts) {
      add(prompt.title);
      const category = prompt.categories[0]?.name;
      const tag = prompt.tags[0]?.name;
      const model = prompt.supportedModels[0];
      if (category && tag) add(`${category} ${tag}`);
      if (model && tag) add(`${model} ${tag}`);
      if (category && prompt.promptType) add(`${category} ${prompt.promptType}`);
      if (suggestions.length >= 10) return suggestions;
    }

    for (const category of categories) {
      const matchedTag = tags.find((tag) => tag.toLowerCase() !== category.toLowerCase());
      if (matchedTag) add(`${category} ${matchedTag}`);
      add(category);
      if (suggestions.length >= 10) return suggestions;
    }

    for (const tag of tags) {
      add(tag);
      if (suggestions.length >= 10) return suggestions;
    }

    return suggestions;
  }

  async syncFromConfiguredSources() {
    const sources = this.getConfiguredSources();

    if (sources.length === 0) {
      this.logger.warn('Prompt sync skipped: no prompt sources configured.');
      return { sources: 0, promptsFound: 0, promptsSaved: 0 };
    }

    let promptsFound = 0;
    let promptsSaved = 0;

    for (const source of sources) {
      const crawlLog = await this.prisma.db.promptCrawlLog.create({
        data: { sourceType: source.type, sourceUrl: source.url, status: 'RUNNING' },
      });

      try {
        const prompts = await this.fetchSourcePrompts(source);
        promptsFound += prompts.length;

        for (const prompt of prompts) {
          const processed = await this.processPromptCandidate(prompt, source);
          if (processed.action === 'skip') {
            this.logger.log(
              `Prompt skipped: source=${source.name} similarity=${processed.similarity}% reason=${processed.reason}`,
            );
            continue;
          }

          const saved = await this.upsertPrompt(processed.prompt, source);
          if (saved) promptsSaved += 1;
        }

        await this.prisma.db.promptCrawlLog.update({
          where: { id: crawlLog.id },
          data: { status: 'COMPLETED', promptsFound: prompts.length, promptsSaved: prompts.length, completedAt: new Date() },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(`Prompt sync failed for ${source.name}: ${message}`);
        await this.prisma.db.promptCrawlLog.update({
          where: { id: crawlLog.id },
          data: { status: 'FAILED', errorMessage: message, completedAt: new Date() },
        });
      }
    }

    this.logger.log(`Prompt sync completed: sources=${sources.length} found=${promptsFound} saved=${promptsSaved}`);
    return { sources: sources.length, promptsFound, promptsSaved };
  }

  async reprocessExistingPrompts(limit = 25) {
    const take = Math.max(1, Math.min(100, Math.round(limit)));
    const prompts = await this.prisma.db.prompt.findMany({
      where: { status: 'PUBLISHED' },
      include: {
        categories: true,
        tags: true,
        sources: { orderBy: { fetchedAt: 'desc' }, take: 1 },
      },
      orderBy: [{ qualityScore: 'asc' }, { lastUpdatedAt: 'asc' }],
      take,
    });

    let processed = 0;
    for (const prompt of prompts) {
      const sourceRef = prompt.sources[0];
      const source: PromptSourceConfig = {
        name: sourceRef?.sourceName ?? prompt.sourceUrl ?? 'Existing prompt',
        url: sourceRef?.sourceUrl ?? prompt.sourceUrl ?? 'local-existing-prompt',
        type: (sourceRef?.sourceType as PromptSourceType | undefined) ?? 'json-feed',
        priority: prompt.featured ? 5 : 3,
      };
      const aiPrompt = await this.processPromptWithAi(
        {
          title: prompt.title,
          description: prompt.description,
          prompt: prompt.prompt,
          promptType: prompt.promptType,
          difficulty: prompt.difficulty,
          categories: prompt.categories.map((category) => category.name),
          tags: prompt.tags.map((tag) => tag.name),
          supportedModels: prompt.supportedModels,
          qualityScore: prompt.qualityScore,
          readabilityScore: prompt.readabilityScore,
          structureScore: prompt.structureScore,
          variablesScore: prompt.variablesScore,
          reusabilityScore: prompt.reusabilityScore,
          featured: prompt.featured,
          trendingScore: prompt.trendingScore,
          variables: prompt.variables,
          exampleInput: prompt.exampleInput,
          exampleOutput: prompt.exampleOutput,
        },
        source,
      );

      await this.upsertPrompt(aiPrompt, source);
      processed += 1;
    }

    return { requested: take, processed };
  }

  private buildHybridFilterSql(input: SearchPromptsDto) {
    const filters: Prisma.Sql[] = [Prisma.sql`p."status" = 'PUBLISHED'`];

    if (input.category && input.category !== 'all') {
      filters.push(Prisma.sql`EXISTS (
        SELECT 1 FROM "aiverse_jobs"."PromptCategory" fc
        WHERE fc."promptId" = p."id" AND fc."slug" = ${input.category}
      )`);
    }

    if (input.model && input.model !== 'all') {
      filters.push(Prisma.sql`${input.model} = ANY(p."supportedModels")`);
    }

    if (input.difficulty && input.difficulty !== 'all') {
      filters.push(Prisma.sql`LOWER(p."difficulty") = LOWER(${input.difficulty})`);
    }

    if (input.promptType && input.promptType !== 'all') {
      filters.push(Prisma.sql`LOWER(p."promptType") = LOWER(${input.promptType})`);
    }

    if (input.tab === 'recommended') {
      filters.push(Prisma.sql`
        p."qualityScore" >= 92
        AND p."readabilityScore" >= 92
        AND p."structureScore" >= 92
        AND p."variablesScore" >= 92
        AND p."reusabilityScore" >= 92
      `);
    }

    return Prisma.join(filters, ' AND ');
  }

  private buildHybridOrderSql(input: SearchPromptsDto) {
    const sort = input.sort ?? input.tab ?? 'trending';
    if (sort === 'featured') return Prisma.sql`"featured" DESC, rank_score DESC, "qualityScore" DESC, "trendingScore" DESC`;
    if (sort === 'latest') return Prisma.sql`rank_score DESC, "publishedAt" DESC`;
    if (sort === 'quality' || sort === 'recommended') return Prisma.sql`rank_score DESC, "qualityScore" DESC, "trendingScore" DESC`;
    if (sort === 'used') return Prisma.sql`rank_score DESC, "copies" DESC, "trendingScore" DESC`;
    if (sort === 'saved') return Prisma.sql`rank_score DESC, "saves" DESC, "trendingScore" DESC`;
    return Prisma.sql`rank_score DESC, "trendingScore" DESC, "qualityScore" DESC`;
  }

  private expandPromptSearchQuery(query: string) {
    const normalized = query.toLowerCase();
    const extras = new Set<string>();
    const semanticGroups = [
      ['email', 'mail', 'newsletter', 'outreach', 'campaign', 'copywriting'],
      ['blog', 'article', 'outline', 'content', 'writing', 'seo'],
      ['code', 'coding', 'developer', 'programming', 'debug', 'software'],
      ['claude', 'anthropic'],
      ['gpt', 'chatgpt', 'openai'],
      ['gemini', 'google'],
      ['support', 'customer', 'helpdesk', 'service', 'agent'],
      ['image', 'logo', 'design', 'creative', 'visual'],
      ['marketing', 'sales', 'growth', 'copywriting', 'campaign'],
      ['system', 'assistant', 'role', 'instruction'],
      ['json', 'schema', 'structured', 'format'],
      ['workflow', 'automation', 'agent', 'chain'],
    ];

    for (const group of semanticGroups) {
      if (group.some((term) => normalized.includes(term))) {
        for (const term of group) extras.add(term);
      }
    }

    return [query, ...extras].join(' ');
  }

  private buildWhere(input: SearchPromptsDto): Prisma.PromptWhereInput {
    const q = input.q?.trim();
    return {
      status: 'PUBLISHED',
      ...(input.category && input.category !== 'all'
        ? { categories: { some: { slug: input.category } } }
        : {}),
      ...(input.model && input.model !== 'all'
        ? { supportedModels: { has: input.model } }
        : {}),
      ...(input.difficulty && input.difficulty !== 'all'
        ? { difficulty: { equals: input.difficulty, mode: 'insensitive' } }
        : {}),
      ...(input.promptType && input.promptType !== 'all'
        ? { promptType: { equals: input.promptType, mode: 'insensitive' } }
        : {}),
      ...(input.tab === 'recommended'
        ? {
            qualityScore: { gte: 92 },
            readabilityScore: { gte: 92 },
            structureScore: { gte: 92 },
            variablesScore: { gte: 92 },
            reusabilityScore: { gte: 92 },
          }
        : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: 'insensitive' } },
              { description: { contains: q, mode: 'insensitive' } },
              { prompt: { contains: q, mode: 'insensitive' } },
              { categories: { some: { name: { contains: q, mode: 'insensitive' } } } },
              { tags: { some: { name: { contains: q, mode: 'insensitive' } } } },
            ],
          }
        : {}),
    };
  }

  private buildOrder(input: SearchPromptsDto): Prisma.PromptOrderByWithRelationInput[] {
    const sort = input.sort ?? input.tab ?? 'trending';
    if (sort === 'featured') return [{ featured: 'desc' }, { qualityScore: 'desc' }, { trendingScore: 'desc' }];
    if (sort === 'latest') return [{ publishedAt: 'desc' }];
    if (sort === 'quality' || sort === 'recommended') return [{ qualityScore: 'desc' }, { trendingScore: 'desc' }];
    if (sort === 'used') return [{ stats: { copies: 'desc' } }, { trendingScore: 'desc' }, { qualityScore: 'desc' }];
    if (sort === 'saved') return [{ stats: { saves: 'desc' } }, { trendingScore: 'desc' }, { qualityScore: 'desc' }];
    return [{ trendingScore: 'desc' }, { qualityScore: 'desc' }];
  }

  private parsePromptFeed(payload: unknown) {
    if (Array.isArray(payload)) return payload as Array<Record<string, unknown>>;
    if (payload && typeof payload === 'object' && Array.isArray((payload as { prompts?: unknown }).prompts)) {
      return (payload as { prompts: Array<Record<string, unknown>> }).prompts;
    }
    if (payload && typeof payload === 'object' && Array.isArray((payload as { data?: unknown }).data)) {
      return (payload as { data: Array<Record<string, unknown>> }).data;
    }
    return [];
  }

  private getConfiguredSources(): PromptSourceConfig[] {
    const envSources = (process.env.PROMPT_SOURCE_URLS ?? '')
      .split(',')
      .map((source) => source.trim())
      .filter(Boolean)
      .map((url) => ({
        name: url,
        url,
        type: this.inferSourceType(url),
        priority: 3,
      }));
    const sources = envSources.length > 0 ? envSources : DEFAULT_PROMPT_SOURCES;
    const maxSources = this.numberValue(process.env.PROMPT_MAX_SOURCES_PER_SYNC, sources.length);
    return sources
      .sort((a, b) => b.priority - a.priority)
      .slice(0, Math.max(1, maxSources));
  }

  private inferSourceType(url: string): PromptSourceType {
    if (/\.csv($|\?)/i.test(url)) return 'csv-feed';
    if (/\.json($|\?)/i.test(url)) return 'json-feed';
    if (/github\.com\/search/i.test(url)) return 'github-search';
    if (/github\.com\/[^/]+\/[^/]+/i.test(url)) return 'github-repo';
    return 'html';
  }

  private async fetchSourcePrompts(source: PromptSourceConfig) {
    if (source.type === 'json-feed') {
      const payload = await this.fetchJson(source.fetchUrl ?? source.url);
      return this.parsePromptFeed(payload).slice(0, this.maxPromptsPerSource());
    }
    if (source.type === 'csv-feed') {
      const csv = await this.fetchText(source.fetchUrl ?? source.url);
      return this.parseCsvPrompts(csv, source).slice(0, this.maxPromptsPerSource());
    }
    if (source.type === 'github-repo') {
      return this.fetchGithubRepoPrompts(source);
    }
    if (source.type === 'github-search') {
      return this.fetchGithubSearchPrompts(source);
    }
    const html = await this.fetchText(source.fetchUrl ?? source.url);
    return this.extractPromptLikeBlocks(html, source).slice(0, this.maxPromptsPerSource());
  }

  private async fetchGithubSearchPrompts(source: PromptSourceConfig) {
    const payload = await this.fetchJson(source.fetchUrl ?? source.url);
    const items = Array.isArray((payload as { items?: unknown }).items)
      ? ((payload as { items: Array<Record<string, unknown>> }).items)
      : [];
    const prompts: Array<Record<string, unknown>> = [];

    for (const repo of items.slice(0, 5)) {
      const htmlUrl = this.stringValue(repo.html_url);
      if (!htmlUrl) continue;
      prompts.push(...(await this.fetchGithubRepoPrompts({
        name: this.stringValue(repo.full_name) || htmlUrl,
        url: htmlUrl,
        type: 'github-repo',
        priority: source.priority,
      })));
      if (prompts.length >= this.maxPromptsPerSource()) break;
    }

    return prompts.slice(0, this.maxPromptsPerSource());
  }

  private async fetchGithubRepoPrompts(source: PromptSourceConfig) {
    const match = source.url.match(/github\.com\/([^/]+)\/([^/#?]+)/i);
    if (!match) return [];

    const [, owner, repoNameRaw] = match;
    const repoName = repoNameRaw.replace(/\.git$/i, '');
    const repo = await this.fetchJson(`https://api.github.com/repos/${owner}/${repoName}`);
    const defaultBranch = this.stringValue((repo as Record<string, unknown>).default_branch) || 'main';
    const tree = await this.fetchJson(`https://api.github.com/repos/${owner}/${repoName}/git/trees/${defaultBranch}?recursive=1`);
    const files = Array.isArray((tree as { tree?: unknown }).tree)
      ? (tree as { tree: Array<Record<string, unknown>> }).tree
      : [];
    const markdownFiles = files
      .map((file) => this.stringValue(file.path))
      .filter((path) => /\.(md|mdx|txt)$/i.test(path))
      .filter((path) => /prompt|example|cookbook|guide|readme/i.test(path))
      .slice(0, 8);

    const prompts: Array<Record<string, unknown>> = [];
    for (const path of markdownFiles) {
      const rawUrl = `https://raw.githubusercontent.com/${owner}/${repoName}/${defaultBranch}/${path}`;
      const markdown = await this.fetchText(rawUrl);
      prompts.push(...this.extractPromptLikeBlocks(markdown, { ...source, url: rawUrl }));
      if (prompts.length >= this.maxPromptsPerSource()) break;
    }

    return prompts.slice(0, this.maxPromptsPerSource());
  }

  private async fetchJson(url: string) {
    const response = await fetch(url, { signal: AbortSignal.timeout(Number(process.env.PROMPT_SOURCE_TIMEOUT_MS ?? 15_000)) });
    if (!response.ok) throw new Error(`Prompt source returned ${response.status} ${response.statusText}`);
    return response.json();
  }

  private async fetchText(url: string) {
    const response = await fetch(url, { signal: AbortSignal.timeout(Number(process.env.PROMPT_SOURCE_TIMEOUT_MS ?? 15_000)) });
    if (!response.ok) throw new Error(`Prompt source returned ${response.status} ${response.statusText}`);
    return response.text();
  }

  private parseCsvPrompts(csv: string, source: PromptSourceConfig) {
    const rows = this.parseCsvRows(csv);
    if (rows.length < 2) return [];

    const headers = rows[0].map((header) => this.slugify(header));
    return rows.slice(1).map((row) => {
      const record = Object.fromEntries(headers.map((header, index) => [header, row[index] ?? '']));
      const title = record.act || record.title || record.name;
      const prompt = record.prompt || record.content || record.template;
      return {
        title,
        description: `Imported from ${source.name}.`,
        prompt,
        promptType: 'Template',
        difficulty: 'Intermediate',
        authorName: source.name,
        license: 'Source license required',
        categories: ['Prompt Engineering'],
        tags: ['ChatGPT', 'Prompt Library'],
        supportedModels: ['GPT-5', 'Claude', 'Gemini'],
        qualityScore: 82 + source.priority,
        readabilityScore: 82,
        structureScore: 80,
        variablesScore: 70,
        reusabilityScore: 84,
        trendingScore: source.priority,
      };
    }).filter((prompt) => this.stringValue(prompt.title) && this.stringValue(prompt.prompt));
  }

  private parseCsvRows(csv: string) {
    const rows: string[][] = [];
    let row: string[] = [];
    let field = '';
    let quoted = false;

    for (let index = 0; index < csv.length; index += 1) {
      const char = csv[index];
      const next = csv[index + 1];
      if (char === '"' && quoted && next === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = !quoted;
      } else if (char === ',' && !quoted) {
        row.push(field);
        field = '';
      } else if ((char === '\n' || char === '\r') && !quoted) {
        if (char === '\r' && next === '\n') index += 1;
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
      } else {
        field += char;
      }
    }

    if (field || row.length) {
      row.push(field);
      rows.push(row);
    }

    return rows.filter((items) => items.some((item) => item.trim()));
  }

  private extractPromptLikeBlocks(content: string, source: PromptSourceConfig) {
    const normalized = content
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, '\n')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\r/g, '');
    const fenced = [...normalized.matchAll(/```(?:[a-z0-9_-]+)?\n([\s\S]*?)```/gi)].map((match) => match[1].trim());
    const sections = normalized.split(/\n#{1,4}\s+|\n(?=[A-Z][A-Za-z0-9 ,:/-]{8,80}\n)/g);
    const candidates = [...fenced, ...sections]
      .map((block) => block.replace(/\n{3,}/g, '\n\n').trim())
      .filter((block) => block.length >= 120 && block.length <= 5000)
      .filter((block) => /prompt|system|user|assistant|instruction|template|role|example/i.test(block))
      .slice(0, this.maxPromptsPerSource());

    return candidates.map((block, index) => {
      const firstLine = block.split('\n').find((line) => line.trim().length > 8)?.trim() ?? `${source.name} prompt ${index + 1}`;
      const title = firstLine.replace(/^#+\s*/, '').replace(/[:.]\s*$/, '').slice(0, 90);
      return {
        title: title || `${source.name} prompt ${index + 1}`,
        description: `Prompt example extracted from ${source.name}.`,
        prompt: block,
        promptType: /system/i.test(block) ? 'System Prompt' : 'Template',
        difficulty: source.priority >= 5 ? 'Advanced' : 'Intermediate',
        authorName: source.name,
        license: 'Source license required',
        categories: ['Prompt Engineering'],
        tags: [source.type, source.name],
        supportedModels: this.modelsForSource(source.name),
        qualityScore: 76 + source.priority * 3,
        readabilityScore: 78,
        structureScore: 76,
        variablesScore: /\{\{.+?\}\}/.test(block) ? 86 : 64,
        reusabilityScore: 78,
        trendingScore: source.priority,
      };
    });
  }

  private modelsForSource(name: string) {
    const lower = name.toLowerCase();
    if (lower.includes('anthropic') || lower.includes('claude')) return ['Claude', 'GPT-5', 'Gemini'];
    if (lower.includes('gemini') || lower.includes('google')) return ['Gemini', 'GPT-5', 'Claude'];
    if (lower.includes('mistral')) return ['Mistral', 'GPT-5', 'Claude'];
    if (lower.includes('cohere')) return ['Cohere', 'GPT-5', 'Claude'];
    return ['GPT-5', 'Claude', 'Gemini'];
  }

  private maxPromptsPerSource() {
    return Math.max(1, this.numberValue(process.env.PROMPT_MAX_PROMPTS_PER_SOURCE, 40));
  }

  private async processPromptCandidate(raw: PromptCandidate, source: PromptSourceConfig): Promise<PromptProcessingResult> {
    const title = this.stringValue(raw.title);
    const promptText = this.stringValue(raw.prompt ?? raw.content ?? raw.template);
    if (!title || !promptText) return { action: 'skip', reason: 'missing title or prompt', similarity: 0 };

    const nearest = await this.findNearestPrompt(title, promptText);
    if (nearest.similarity > 95) {
      return { action: 'skip', reason: `near duplicate of ${nearest.prompt?.slug ?? 'existing prompt'}`, similarity: nearest.similarity };
    }

    if (nearest.similarity >= 70 && nearest.prompt) {
      const sameIntent = await this.comparePromptIntentWithAi(
        { title, prompt: promptText },
        nearest.prompt,
        nearest.similarity,
      );
      if (sameIntent) {
        return { action: 'skip', reason: `same intent as ${nearest.prompt.slug}`, similarity: nearest.similarity };
      }
    }

    const processed = await this.processPromptWithAi(raw, source);
    return { action: 'save', prompt: processed, similarity: nearest.similarity };
  }

  private async findNearestPrompt(title: string, promptText: string) {
    const existing = await this.prisma.db.prompt.findMany({
      where: { status: 'PUBLISHED' },
      select: { id: true, slug: true, title: true, prompt: true },
      orderBy: { lastUpdatedAt: 'desc' },
      take: 1000,
    });

    let best: { prompt: ExistingPromptForSimilarity | null; similarity: number } = { prompt: null, similarity: 0 };
    const candidateText = `${title}\n${promptText}`;
    for (const prompt of existing) {
      const similarity = this.textSimilarityPercent(candidateText, `${prompt.title}\n${prompt.prompt}`);
      if (similarity > best.similarity) best = { prompt, similarity };
    }
    return best;
  }

  private textSimilarityPercent(left: string, right: string) {
    const leftTokens = this.weightedTokenMap(left);
    const rightTokens = this.weightedTokenMap(right);
    if (leftTokens.size === 0 || rightTokens.size === 0) return 0;

    const tokens = new Set([...leftTokens.keys(), ...rightTokens.keys()]);
    let dot = 0;
    let leftMagnitude = 0;
    let rightMagnitude = 0;
    for (const token of tokens) {
      const leftValue = leftTokens.get(token) ?? 0;
      const rightValue = rightTokens.get(token) ?? 0;
      dot += leftValue * rightValue;
      leftMagnitude += leftValue ** 2;
      rightMagnitude += rightValue ** 2;
    }

    const cosine = dot / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude));
    return Math.round(Math.max(0, Math.min(1, cosine)) * 100);
  }

  private weightedTokenMap(value: string) {
    const map = new Map<string, number>();
    const tokens = value
      .toLowerCase()
      .split(/[^a-z0-9]+/g)
      .filter((token) => token.length > 2);
    for (const token of tokens) {
      map.set(token, (map.get(token) ?? 0) + 1);
    }
    return map;
  }

  private async comparePromptIntentWithAi(
    candidate: { title: string; prompt: string },
    existing: ExistingPromptForSimilarity,
    similarity: number,
  ) {
    if (process.env.PROMPT_AI_SIMILARITY_COMPARE_ENABLED === 'false') return similarity >= 88;
    const result = await this.callOpenRouterJson<{ sameIntent?: boolean; confidence?: number; reason?: string }>(
      'You compare prompt intent. Return ONLY JSON: {"sameIntent":boolean,"confidence":number 0-100,"reason":"max 16 words"}. Same intent means the prompts solve the same user need even if wording differs.',
      {
        similarity,
        candidate: { title: candidate.title, prompt: this.truncate(candidate.prompt, 2500) },
        existing: { title: existing.title, prompt: this.truncate(existing.prompt, 2500) },
      },
      'prompt-intent-comparison',
    );
    if (!result) return similarity >= 88;
    return Boolean(result.sameIntent) && this.numberValue(result.confidence, 0) >= 70;
  }

  private async processPromptWithAi(raw: PromptCandidate, source: PromptSourceConfig): Promise<PromptCandidate> {
    const title = this.stringValue(raw.title);
    const promptText = this.stringValue(raw.prompt ?? raw.content ?? raw.template);
    const fallback = this.buildFallbackProcessedPrompt(raw, source);

    if (process.env.PROMPT_AI_PROCESSING_ENABLED === 'false' || !process.env.OPENROUTER_API_KEY?.trim()) {
      this.logger.warn(`Prompt AI processing skipped for "${title}" because OpenRouter is not configured or disabled.`);
      return fallback;
    }

    const processed = await this.callOpenRouterJson<AiProcessedPrompt>(
      [
        'Return ONLY valid JSON. You clean and classify AI prompts for a production prompt library.',
        'Schema: {"title":"max 12 words","description":"max 45 words","prompt":"clean full prompt","promptType":"System Prompt|User Prompt|Template|Workflow|Agent|JSON|Image Prompt|Few-shot","difficulty":"Beginner|Intermediate|Advanced","categories":["1-3 category names"],"tags":["4-8 tags"],"supportedModels":["1-5 model/provider names"],"qualityScore":number 1-100,"readabilityScore":number 1-100,"structureScore":number 1-100,"variablesScore":number 1-100,"reusabilityScore":number 1-100,"featured":boolean,"trendingScore":number 0-100,"variables":{},"exampleInput":{},"exampleOutput":"optional short example"}',
        'Rules: preserve useful prompt instructions, remove boilerplate/source navigation text, infer categories and difficulty, score honestly, do not hallucinate unsupported claims.',
      ].join('\n'),
      {
        source: { name: source.name, type: source.type, priority: source.priority, url: source.url },
        raw: {
          title,
          description: this.stringValue(raw.description),
          prompt: this.truncate(promptText, 6000),
          tags: raw.tags,
          categories: raw.categories ?? raw.category,
          supportedModels: raw.supportedModels ?? raw.models,
        },
      },
      'prompt-metadata-processing',
    );

    if (!processed?.title || !processed?.prompt) return fallback;

    return {
      ...fallback,
      title: processed.title,
      description: processed.description || fallback.description,
      prompt: processed.prompt,
      promptType: processed.promptType || fallback.promptType,
      difficulty: processed.difficulty || fallback.difficulty,
      categories: Array.isArray(processed.categories) && processed.categories.length ? processed.categories : fallback.categories,
      tags: Array.isArray(processed.tags) && processed.tags.length ? processed.tags : fallback.tags,
      supportedModels: Array.isArray(processed.supportedModels) && processed.supportedModels.length
        ? processed.supportedModels
        : fallback.supportedModels,
      qualityScore: this.clampPercent(processed.qualityScore, fallback.qualityScore as number),
      readabilityScore: this.clampPercent(processed.readabilityScore, fallback.readabilityScore as number),
      structureScore: this.clampPercent(processed.structureScore, fallback.structureScore as number),
      variablesScore: this.clampPercent(processed.variablesScore, fallback.variablesScore as number),
      reusabilityScore: this.clampPercent(processed.reusabilityScore, fallback.reusabilityScore as number),
      featured: Boolean(processed.featured) || Boolean(fallback.featured),
      trendingScore: this.clampPercent(processed.trendingScore, fallback.trendingScore as number),
      variables: processed.variables ?? fallback.variables,
      exampleInput: processed.exampleInput ?? fallback.exampleInput,
      exampleOutput: processed.exampleOutput ?? fallback.exampleOutput,
    };
  }

  private buildFallbackProcessedPrompt(raw: PromptCandidate, source: PromptSourceConfig): PromptCandidate {
    const title = this.stringValue(raw.title);
    const promptText = this.stringValue(raw.prompt ?? raw.content ?? raw.template);
    return {
      ...raw,
      title,
      description: this.stringValue(raw.description) || promptText.slice(0, 220),
      prompt: promptText,
      promptType: this.stringValue(raw.promptType ?? raw.type) || 'Template',
      difficulty: this.stringValue(raw.difficulty) || (source.priority >= 5 ? 'Advanced' : 'Intermediate'),
      categories: this.stringArray(raw.categories ?? raw.category).length
        ? this.stringArray(raw.categories ?? raw.category)
        : ['Prompt Engineering'],
      tags: this.stringArray(raw.tags).length ? this.stringArray(raw.tags) : [source.type, source.name],
      supportedModels: this.stringArray(raw.supportedModels ?? raw.models).length
        ? this.stringArray(raw.supportedModels ?? raw.models)
        : this.modelsForSource(source.name),
      qualityScore: this.numberValue(raw.qualityScore, 76 + source.priority * 3),
      readabilityScore: this.numberValue(raw.readabilityScore, 78),
      structureScore: this.numberValue(raw.structureScore, 76),
      variablesScore: this.numberValue(raw.variablesScore, /\{\{.+?\}\}/.test(promptText) ? 86 : 64),
      reusabilityScore: this.numberValue(raw.reusabilityScore, 78),
      featured: Boolean(raw.featured) || source.priority >= 5,
      trendingScore: this.numberValue(raw.trendingScore, source.priority),
    };
  }

  private async callOpenRouterJson<T>(system: string, userPayload: unknown, purpose: string): Promise<T | null> {
    const apiKey = process.env.OPENROUTER_API_KEY?.trim();
    if (!apiKey) return null;

    const url = this.resolveOpenRouterChatUrl();
    const model = process.env.OPENROUTER_MODEL?.trim() || 'openrouter/free';
    try {
      const response = await this.withTimeout(
        fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.OPENROUTER_SITE_URL ?? 'https://aiverseworld.com',
            'X-Title': process.env.OPENROUTER_APP_NAME ?? 'AiverseWorld Prompt Library',
          },
          body: JSON.stringify({
            model,
            temperature: 0.1,
            response_format: { type: 'json_object' },
            messages: [
              { role: 'system', content: system },
              { role: 'user', content: JSON.stringify(userPayload) },
            ],
          }),
        }),
        Number(process.env.PROMPT_AI_TIMEOUT_MS ?? 15_000),
      );

      if (!response.ok) {
        this.logger.warn(`OpenRouter ${purpose} returned HTTP ${response.status}.`);
        return null;
      }

      const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string | object } }> };
      const content = payload.choices?.[0]?.message?.content;
      if (!content) return null;
      return typeof content === 'string'
        ? (JSON.parse(this.cleanJsonContent(content)) as T)
        : (content as T);
    } catch (error) {
      this.logger.warn(`OpenRouter ${purpose} failed: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  private resolveOpenRouterChatUrl() {
    const configuredUrl = process.env.OPENROUTER_BASE_URL?.trim();
    const base = (configuredUrl ?? 'https://openrouter.ai/api/v1').replace(/\/+$/, '');
    if (base.endsWith('/chat/completions')) return base;
    if (base.endsWith('/api/v1')) return `${base}/chat/completions`;
    if (base.endsWith('/api')) return `${base}/v1/chat/completions`;
    return `${base}/api/v1/chat/completions`;
  }

  private cleanJsonContent(value: string) {
    return value.trim().replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
  }

  private withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => setTimeout(() => reject(new Error('OpenRouter request timeout')), ms)),
    ]);
  }

  private truncate(value: string, length: number) {
    return value.length > length ? `${value.slice(0, length)}...` : value;
  }

  private clampPercent(value: unknown, fallback: number) {
    const parsed = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(parsed) ? Math.max(1, Math.min(100, Math.round(parsed))) : fallback;
  }

  private defaultEventKey(type: 'copy' | 'view' | 'share', visitorKey: string | null) {
    const bucketMs = type === 'view' ? 30 * 60 * 1000 : 5 * 1000;
    const bucket = Math.floor(Date.now() / bucketMs);
    return `${visitorKey ?? 'anonymous'}:${type}:${bucket}`;
  }

  private async upsertPrompt(raw: Record<string, unknown>, source: PromptSourceConfig) {
    const title = this.stringValue(raw.title);
    const promptText = this.stringValue(raw.prompt ?? raw.content ?? raw.template);
    if (!title || !promptText) return false;

    const slug = this.slugify(this.stringValue(raw.slug) || `${source.name}-${title}`);
    const categories = this.stringArray(raw.categories ?? raw.category).map((name) => ({ name, slug: this.slugify(name) }));
    const tags = this.stringArray(raw.tags).map((name) => ({ name, slug: this.slugify(name) }));
    const supportedModels = this.stringArray(raw.supportedModels ?? raw.models);
    const contentHash = createHash('sha256').update(`${title}:${promptText}`).digest('hex');

    await this.prisma.db.prompt.upsert({
      where: { slug },
      create: {
        slug,
        title,
        description: this.stringValue(raw.description) || promptText.slice(0, 220),
        prompt: promptText,
        promptType: this.stringValue(raw.promptType ?? raw.type) || 'Template',
        difficulty: this.stringValue(raw.difficulty) || 'Intermediate',
        authorName: this.stringValue(raw.authorName ?? raw.author),
        sourceUrl: source.url,
        license: this.stringValue(raw.license) || 'Unknown',
        supportedModels: supportedModels.length > 0 ? supportedModels : ['GPT-5', 'Claude', 'Gemini'],
        variables: this.objectValue(raw.variables),
        exampleInput: this.objectValue(raw.exampleInput),
        exampleOutput: this.stringValue(raw.exampleOutput),
        qualityScore: this.numberValue(raw.qualityScore, 80),
        readabilityScore: this.numberValue(raw.readabilityScore, 80),
        structureScore: this.numberValue(raw.structureScore, 80),
        variablesScore: this.numberValue(raw.variablesScore, 80),
        reusabilityScore: this.numberValue(raw.reusabilityScore, 80),
        featured: Boolean(raw.featured) || source.priority >= 5,
        trendingScore: this.numberValue(raw.trendingScore, 0),
        categories: { create: categories },
        tags: { create: tags },
        sources: { create: { sourceType: source.type, sourceName: source.name, sourceUrl: source.url, contentHash } },
        stats: { create: { views: 0, copies: 0, saves: 0, likes: 0 } },
        versions: { create: { version: 1, prompt: promptText, notes: 'Imported from prompt source feed.' } },
      },
      update: {
        title,
        description: this.stringValue(raw.description) || promptText.slice(0, 220),
        prompt: promptText,
        promptType: this.stringValue(raw.promptType ?? raw.type) || 'Template',
        difficulty: this.stringValue(raw.difficulty) || 'Intermediate',
        authorName: this.stringValue(raw.authorName ?? raw.author),
        sourceUrl: source.url,
        license: this.stringValue(raw.license) || 'Unknown',
        supportedModels: supportedModels.length > 0 ? supportedModels : ['GPT-5', 'Claude', 'Gemini'],
        variables: this.objectValue(raw.variables) ?? Prisma.JsonNull,
        exampleInput: this.objectValue(raw.exampleInput) ?? Prisma.JsonNull,
        exampleOutput: this.stringValue(raw.exampleOutput),
        qualityScore: this.numberValue(raw.qualityScore, 80),
        readabilityScore: this.numberValue(raw.readabilityScore, 80),
        structureScore: this.numberValue(raw.structureScore, 80),
        variablesScore: this.numberValue(raw.variablesScore, 80),
        reusabilityScore: this.numberValue(raw.reusabilityScore, 80),
        featured: Boolean(raw.featured) || source.priority >= 5,
        trendingScore: this.numberValue(raw.trendingScore, 0),
        lastUpdatedAt: new Date(),
      },
    });
    return true;
  }

  private stringValue(value: unknown) {
    return typeof value === 'string' ? value.trim() : '';
  }

  private stringArray(value: unknown) {
    if (Array.isArray(value)) return value.map((item) => this.stringValue(item)).filter(Boolean);
    const single = this.stringValue(value);
    return single ? [single] : [];
  }

  private numberValue(value: unknown, fallback: number) {
    const parsed = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(parsed) ? Math.round(parsed) : fallback;
  }

  private objectValue(value: unknown) {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Prisma.InputJsonObject)
      : undefined;
  }

  private slugify(value: string) {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 96);
  }
}
