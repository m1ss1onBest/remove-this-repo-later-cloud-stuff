import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('A wonderful wrapper to a blob storage')
    .setDescription('Blob storage API')
    .setVersion('1.0')
    .addTag('minio')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('reference', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
