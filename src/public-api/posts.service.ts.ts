/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Inject, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import * as cacheManager from 'cache-manager';
import { Post, User } from './public-api.entities';

@Injectable()
export class PostsService {
  private readonly baseUrl = 'https://jsonplaceholder.typicode.com';
  private readonly logger = new Logger(PostsService.name);

  constructor(
    private readonly httpService: HttpService,
    @Inject(CACHE_MANAGER) private cacheManager: cacheManager.Cache,
  ) {}

  async getRawPosts(): Promise<any[]> {
    const cacheKey = 'raw_posts';

    try {
      const cached = await this.cacheManager.get<any[]>(cacheKey);
      if (cached) {
        this.logger.log(`Cache HIT: ${cacheKey}`);
        return cached;
      }

      this.logger.log(`Cache MISS: ${cacheKey}. Fetching from API...`);

      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/posts`),
      );

      await this.cacheManager.set(cacheKey, response.data, 60 * 1000);
      this.logger.log(`Cache SET: ${cacheKey} (ttl: 60s)`);

      this.logger.log(`Successfully fetched raw posts`);
      return response.data;
    } catch (err: any) {
      this.logger.error(
        `Failed to fetch raw posts: ${err?.message}`,
        err?.stack,
      );
      throw err;
    }
  }

  async getProcessedPosts(): Promise<Post[]> {
    const cacheKey = 'processed_posts';

    try {
      const cached = await this.cacheManager.get<Post[]>(cacheKey);
      if (cached) {
        this.logger.log(`Cache HIT: ${cacheKey}`);
        return cached;
      }

      this.logger.log(`Cache MISS: ${cacheKey}. Fetching from API...`);

      const [posts, users] = await Promise.all([
        firstValueFrom(this.httpService.get(`${this.baseUrl}/posts`)),
        firstValueFrom(this.httpService.get(`${this.baseUrl}/users`)),
      ]);

      this.logger.log(`Both posts and users successfully fetched`);

      const userMap = new Map<number, User>();
      users.data.forEach((u: any) => userMap.set(u.id, u));

      const processed: Post[] = posts.data.map((p: any) => ({
        ...p,
        shortBody: p.body.length > 100 ? p.body.slice(0, 100) + '...' : p.body,
        user: userMap.get(p.userId),
      }));

      await this.cacheManager.set(cacheKey, processed, 5 * 60 * 1000);
      this.logger.log(`Cache SET: ${cacheKey} (ttl: 5m)`);

      this.logger.log(`Successfully processed posts`);
      return processed;
    } catch (err: any) {
      this.logger.error(`Failed to process posts: ${err?.message}`, err?.stack);
      throw err;
    }
  }
}
