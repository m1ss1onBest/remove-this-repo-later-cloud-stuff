import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { MinioService } from './blob-storage/minio.service';
import { AppController } from './app.controller';
import { StorageController } from './blob-storage/blob.controller';
import { PostsService } from './public-api/posts.service.ts';
import { PostsController } from './public-api/public-api.controller';
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';

@Module({
  imports: [
    HttpModule,
    CacheModule.register({
      store: redisStore,
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      ttl: 300,
    }),
  ],
  controllers: [AppController, StorageController, PostsController],
  providers: [AppService, MinioService, PostsService],
})
export class AppModule {}
