/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Inject } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import * as cacheManager from 'cache-manager';
import { Post, User } from './public-api.entities';

@Injectable()
export class PostsService {
  private readonly baseUrl = 'https://jsonplaceholder.typicode.com';

  constructor(
    private readonly httpService: HttpService,
    @Inject(CACHE_MANAGER) private cacheManager: cacheManager.Cache,
  ) {}

  async getRawPosts(): Promise<any[]> {
    const cacheKey = 'raw_posts';
    const cached = await this.cacheManager.get<any[]>(cacheKey);
    if (cached) return cached;

    const data = await firstValueFrom(
      this.httpService.get(`${this.baseUrl}/posts`),
    );
    await this.cacheManager.set(cacheKey, data.data, 60 * 1000);
    return data.data;
  }

  async getProcessedPosts(): Promise<Post[]> {
    const cacheKey = 'processed_posts';
    const cached = await this.cacheManager.get<Post[]>(cacheKey);
    if (cached) return cached;

    const [posts, users] = await Promise.all([
      firstValueFrom(this.httpService.get(`${this.baseUrl}/posts`)),
      firstValueFrom(this.httpService.get(`${this.baseUrl}/users`)),
    ]);

    const userMap = new Map<number, User>();
    users.data.forEach((u: any) => userMap.set(u.id, u));

    const processed: Post[] = posts.data.map((p: any) => ({
      // some very expensive operations
      // e.g. shortening body
      ...p,
      shortBody: p.body.length > 100 ? p.body.slice(0, 100) + '...' : p.body,
      user: userMap.get(p.userId),
    }));

    await this.cacheManager.set(cacheKey, processed, 5 * 60 * 1000);
    return processed;
  }
}
