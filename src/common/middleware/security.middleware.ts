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
        helmet()(req, res, () => {
            mongoSanitize()(req, res, () => {
                hpp()(req, res, () => {
                    this.rateLimiter(req, res, () => {
                        cookieParser()(req, res, next);
                    });
                });
            });
        });
    }
}