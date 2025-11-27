import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { PostsService } from './posts.service.ts.js';
import { Post } from './public-api.entities';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CacheInterceptor } from '@nestjs/cache-manager';

@ApiTags('posts')
@Controller('posts')
@UseInterceptors(CacheInterceptor)
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get('raw')
  @ApiOperation({ summary: 'Get raw data' })
  async getRawPosts() {
    return this.postsService.getRawPosts();
  }

  @Get()
  @ApiOperation({ summary: 'Get handled ' })
  @ApiResponse({ status: 200, type: [Post] })
  async getPosts(): Promise<Post[]> {
    return this.postsService.getProcessedPosts();
  }
}
