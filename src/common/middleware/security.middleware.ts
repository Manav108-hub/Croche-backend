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
        // Check if this is one of the GraphQL tool routes
        const isToolRoute = req.path.includes('/api/explorer') || req.path.includes('/api/voyager');
        
        // For explorer/voyager routes, we need to completely disable CSP to make it work easily
        if (isToolRoute) {
            // Disable CSP entirely for the explorer/voyager routes
            const helmetWithoutCsp = helmet({
                contentSecurityPolicy: false
            });
            
            helmetWithoutCsp(req, res, (err: any) => {
                if (err) return next(err);
                
                mongoSanitize()(req, res, (err: any) => {
                    if (err) return next(err);
                    
                    hpp()(req, res, (err: any) => {
                        if (err) return next(err);
                        
                        cookieParser()(req, res, next);
                    });
                });
            });
            
            return;
        }

        // For all other routes, use standard security settings
        const helmetMiddleware = helmet({
            crossOriginEmbedderPolicy: false,
            crossOriginResourcePolicy: false,
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    scriptSrc: [
                        "'self'", 
                        "'unsafe-inline'", 
                        "'unsafe-eval'",
                        "unpkg.com",
                        "cdnjs.cloudflare.com",
                        "cdn.jsdelivr.net"
                    ],
                    styleSrc: [
                        "'self'", 
                        "'unsafe-inline'",
                        "unpkg.com",
                        "cdnjs.cloudflare.com",
                        "cdn.jsdelivr.net"
                    ],
                    imgSrc: ["'self'", "data:", "https:"],
                    connectSrc: ["'self'", "https:", "wss:"],
                    fontSrc: ["'self'", "https:", "data:"]
                }
            }
        });

        // Standard security for non-tool routes
        helmetMiddleware(req, res, (err: any) => {
            if (err) return next(err);

            mongoSanitize()(req, res, (err: any) => {
                if (err) return next(err);

                hpp()(req, res, (err: any) => {
                    if (err) return next(err);

                    this.rateLimiter(req, res, (err: any) => {
                        if (err) return next(err);

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

                        cookieParser()(req, res, next);
                    });
                });
            });
        });
    }
}