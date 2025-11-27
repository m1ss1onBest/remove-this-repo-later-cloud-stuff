/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UploadedFile,
  UseInterceptors,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { MinioService } from './minio.service';
import type { Response } from 'express';

@ApiTags('storage')
@Controller('storage')
export class StorageController {
  constructor(private readonly minioService: MinioService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Load file to minio' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'File loaded successfully' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is necessary!');
    }

    const filename = Date.now() + '-' + file.originalname;
    await this.minioService.upload(filename, file.buffer);
    return { message: 'File uploaded successfully', filename };
  }

  @Get('files')
  @ApiOperation({ summary: 'Get list of all files' })
  @ApiResponse({ status: 200, type: [String] })
  async listFiles() {
    return this.minioService.list();
  }

  @Get('download/:filename')
  @ApiOperation({ summary: 'Download file' })
  @ApiParam({ name: 'filename' })
  async downloadFile(
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    try {
      const object = await this.minioService.get(filename);
      const stat = await this.minioService.client.statObject(
        'mybucket',
        filename,
      );

      res.set({
        'Content-Type':
          stat.metaData['content-type'] || 'application/octet-stream',
        'Content-Length': stat.size,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      });

      object.pipe(res);

      object.on('error', () => {
        if (!res.headersSent) {
          res.status(500).json({ message: 'Internal server error' });
        }
      });
    } catch (err: any) {
      if (err.code === 'NoSuchKey') {
        res.status(404).json({ message: 'File not found' });
      } else {
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  }

  @Delete(':filename')
  @ApiOperation({ summary: 'Delete file by filename' })
  @ApiParam({ name: 'filename', description: 'File name in storage' })
  @ApiResponse({ status: 200, description: 'File deleted' })
  async deleteFile(@Param('filename') filename: string) {
    await this.minioService.delete(filename);
    return { message: `File deleted ${filename} successfully` };
  }
}
