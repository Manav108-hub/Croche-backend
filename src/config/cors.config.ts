import { CorsOptions } from "@nestjs/common/interfaces/external/cors-options.interface";

export const corsConfig: CorsOptions = {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || [
        'http://localhost:3000',
        'http://localhost:4321',
        'http://127.0.0.1:4321',
        'http://127.0.0.1:3000'
    ],
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'Accept',
        'Origin',
        'X-Requested-With',
        'apollo-require-preflight'
    ],
    exposedHeaders: ['Set-Cookie'],
    credentials: true,
    maxAge: 3600,
    preflightContinue: false,
};