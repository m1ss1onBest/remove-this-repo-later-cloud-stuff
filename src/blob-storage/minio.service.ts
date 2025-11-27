import { Injectable } from '@nestjs/common';
import { Client } from 'minio';

@Injectable()
export class MinioService {
  client: Client;
  bucket = 'mybucket';

  constructor() {
    this.client = new Client({
      endPoint: 'localhost',
      port: 9000,
      useSSL: false,
      accessKey: 'minioadmin',
      secretKey: 'minioadmin',
    });
  }

  async ensureBucket() {
    const exists = await this.client.bucketExists(this.bucket);
    if (!exists) {
      await this.client.makeBucket(this.bucket);
    }
  }

  async upload(filename: string, buffer: Buffer) {
    await this.ensureBucket();
    return this.client.putObject(this.bucket, filename, buffer);
  }

  async list() {
    const items: string[] = [];
    const stream = this.client.listObjects(this.bucket, '', true);
    return new Promise<string[]>((resolve, reject) => {
      stream.on('data', (obj) => items.push(obj.name as string));
      stream.on('error', reject);
      stream.on('end', () => resolve(items));
    });
  }

  async delete(filename: string) {
    return this.client.removeObject(this.bucket, filename);
  }

  async get(filename: string) {
    return this.client.getObject(this.bucket, filename);
  }
}
