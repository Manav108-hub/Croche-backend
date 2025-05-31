import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { corsConfig } from './config/cors.config';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter, NestExpressApplication } from '@nestjs/platform-express';
import { graphqlUploadExpress } from 'graphql-upload-ts';
import * as express from 'express';
import { VercelRequest, VercelResponse } from '@vercel/node';

// Cache the NestJS app instance to avoid cold start
let cachedApp: NestExpressApplication;

async function createNestApp(): Promise<NestExpressApplication> {
  if (cachedApp) {
    return cachedApp;
  }

  const expressApp = express()
  const adapter = new ExpressAdapter(expressApp);

  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    adapter,
    { cors: corsConfig }
  );

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

  await app.init();
  cachedApp = app;
  
  return app;
}

// Vercel serverless function handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const app = await createNestApp();
  const expressInstance = app.getHttpAdapter().getInstance();
  return expressInstance(req, res);
}

async function bootstrap() {
  if (process.env.NODE_ENV !== 'production' && process.env.VERCEL !== '1') {
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
}

if (require.main === module) {
  bootstrap();
}
