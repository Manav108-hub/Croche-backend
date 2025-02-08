import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import * as mongoSanitize from "express-mongo-sanitize";
import * as rateLimiter from 'express-rate-limit';
import helmet from 'helmet';
import * as hpp from 'hpp';
import * as cookieParser from 'cookie-parser';

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
    private rateLimiter = rateLimiter.rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100,
        message: 'Too many requests, please try again later.',
        standardHeaders: true,
        legacyHeaders: false,
    });

    use(req: Request, res: Response, next: NextFunction) {
        // Configure Helmet with settings that work with GraphQL
        const helmetMiddleware = helmet({
            crossOriginEmbedderPolicy: false,
            crossOriginResourcePolicy: false,
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    imgSrc: ["'self'", "data:", "https:"],
                    connectSrc: ["'self'", "https:", "wss:"],
                }
            }
        });

        // Chain middleware with proper error handling
        helmetMiddleware(req, res, (err: any) => {
            if (err) return next(err);

            mongoSanitize()(req, res, (err: any) => {
                if (err) return next(err);

                hpp()(req, res, (err: any) => {
                    if (err) return next(err);

                    this.rateLimiter(req, res, (err: any) => {
                        if (err) return next(err);

                        // Set CORS headers after security headers
                        if (req.method === 'OPTIONS') {
                            res.setHeader('Access-Control-Max-Age', '3600');
                            res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
                            res.setHeader(
                                'Access-Control-Allow-Headers',
                                'Content-Type, Authorization, Accept, Origin, X-Requested-With, apollo-require-preflight'
                            );
                            res.setHeader('Access-Control-Allow-Credentials', 'true');
                            res.sendStatus(204);
                            return;
                        }

                        // Parse cookies last to ensure all security checks are done first
                        cookieParser()(req, res, next);
                    });
                });
            });
        });
    }
}