import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ProductModule } from './product/product.module';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver } from '@nestjs/apollo';
import { ThrottlerModule } from '@nestjs/throttler';
import { graphqlConfig } from './config/graphql.config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { GqlThrottlerGuard } from './common/guards/throttle.guard';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { SecurityMiddleware } from './common/middleware/security.middleware';
import { ImageModule } from './image/image.module';
import { CartService } from './cart/cart.service';
import { CartResolver } from './cart/cart.resolver';
import { PubSubService } from './pubsub/pubsub.service';
import { OrderModule } from './order/order.module';
import { ResendController } from './resend/resend.controller';
import { ResendService } from './resend/resend.service';
import { ResendModule } from './resend/resend.module';
import { ExplorerModule } from './explorer/explorer.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
    }),
    ResendModule,
    OrderModule,
    ThrottlerModule.forRoot([{ //spammer se bachna 
      ttl: 60,
      limit: 10,
    }]),
    GraphQLModule.forRoot({
      driver: ApolloDriver,
      ...graphqlConfig,
    }),
    PrismaModule, 
    AuthModule, 
    UserModule, 
    ProductModule, ImageModule, OrderModule, ResendModule, ExplorerModule
  ],
  controllers: [AppController, ResendController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: GqlThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TimeoutInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    CartService,
    CartResolver,
    PubSubService,
    ResendService,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
      consumer.apply(SecurityMiddleware).forRoutes('*');
  }
}
