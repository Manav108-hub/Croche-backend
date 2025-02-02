import { Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { GqlArgumentsHost, GqlExceptionFilter } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';

@Catch()
export class AllExceptionsFilter implements GqlExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const gqlHost = GqlArgumentsHost.create(host);
    const ctx = gqlHost.getContext();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.message;
    }

    // Log error details (in production, use proper logging service)
    console.error({
      status,
      timestamp: new Date().toISOString(),
      path: ctx.req?.url,
      error: exception,
    });

    return new GraphQLError(message, {
      extensions: {
        code: status,
        timestamp: new Date().toISOString(),
      },
    });
  }
}