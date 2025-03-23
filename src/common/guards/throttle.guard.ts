import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException, ThrottlerModuleOptions, ThrottlerStorage } from '@nestjs/throttler';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class GqlThrottlerGuard extends ThrottlerGuard {
  constructor(
    options: ThrottlerModuleOptions,
    storageService: ThrottlerStorage,
    protected readonly reflector: Reflector, // Changed to protected to match parent class
  ) {
    super(options, storageService, reflector);
  }

  getRequestResponse(context: ExecutionContext) {
    // Check if this is a GraphQL context
    if (context.getType().toString() === 'graphql') {
      const gqlCtx = GqlExecutionContext.create(context);
      const ctx = gqlCtx.getContext();

      // Safety check for undefined req
      if (!ctx?.req) {
        return { req: {}, res: {} };
      }

      return { req: ctx.req, res: ctx.res };
    }

    // For HTTP requests, use the parent implementation
    return super.getRequestResponse(context);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if endpoint is public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Handle GraphQL introspection queries
    if (context.getType().toString() === 'graphql') {
      const gqlCtx = GqlExecutionContext.create(context);
      const info = gqlCtx.getInfo();
      
      if (info?.fieldName && ['__schema', '__type', '_service'].includes(info.fieldName)) {
        return true;
      }
    }

    try {
      return await super.canActivate(context);
    } catch (error) {
      if (error instanceof ThrottlerException) {
        throw error;
      }
      
      // For other errors, allow the request but log a warning
      console.warn('Throttler error:', error.message);
      return true;
    }
  }
}