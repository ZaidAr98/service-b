import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');
  app.enableCors();
  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('Service B - Summation API')
    .setDescription('REST API for calculator summation with Kafka consumer')
    .setVersion('1.0')
    .addTag('summation')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);
  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`Service B (REST API) is running on port ${port}`);
  logger.log(`Swagger UI available at http://localhost:${port}/api-docs`);
}
bootstrap();
