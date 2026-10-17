import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for dashboard and external clients
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Support raw bodies for Protobuf OTLP payloads and json for OTLP JSON / REST
  app.use(
    express.raw({
      type: ['application/x-protobuf', 'application/protobuf', 'application/octet-stream'],
      limit: '5mb',
    }),
  );
  app.use(
    express.json({
      limit: '5mb',
    }),
  );

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = process.env.PORT || process.env.API_PORT || 3001;
  await app.listen(port);
  console.log(`GhostTrace API listening on port ${port}`);
}

bootstrap();
