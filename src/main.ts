import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { corsConfig } from './config/cors.config';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { graphqlUploadExpress } from 'graphql-upload-ts';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { cors: corsConfig });
  app.use(cookieParser());

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: false,
    enableDebugMessages: true,
    dismissDefaultMessages: false,
    exceptionFactory: (errors) => {
      console.log('Validation errors', JSON.stringify(errors, null, 2));
    },
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
    disableErrorMessages: process.env.NODE_ENV === 'production',
  }));

  app.setGlobalPrefix('api');
  app.use(graphqlUploadExpress());

  const httpAdapter = app.getHttpAdapter();
  if (httpAdapter && httpAdapter.getInstance) {
    const expressInstance = httpAdapter.getInstance();
    expressInstance.set('trust proxy', 1);
  }

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
