/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { PostsController } from './public-api.controller';
import { PostsService } from './posts.service.ts';

describe('PostsController (Unit)', () => {
  let controller: PostsController;
  let service: PostsService;

  const mockPostsService = {
    getRawPosts: jest.fn(),
    getProcessedPosts: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostsController],
      providers: [
        {
          provide: PostsService,
          useValue: mockPostsService,
        },
      ],
    }).compile();

    controller = module.get<PostsController>(PostsController);
    service = module.get<PostsService>(PostsService);
  });

  it('should return raw posts', async () => {
    const expected = [{ id: 1, title: 'Test' }];
    mockPostsService.getRawPosts.mockResolvedValue(expected);

    const result = await controller.getRawPosts();
    expect(result).toEqual(expected);
    expect(service.getRawPosts).toHaveBeenCalled();
  });

  it('should return processed posts', async () => {
    const expected = [{ id: 1, title: 'Processed' }];
    mockPostsService.getProcessedPosts.mockResolvedValue(expected);

    const result = await controller.getPosts();
    expect(result).toEqual(expected);
    expect(service.getProcessedPosts).toHaveBeenCalled();
  });
});
