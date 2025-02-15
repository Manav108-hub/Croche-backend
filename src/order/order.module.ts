import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderResolver } from './order.resolver';
import { PrismaService } from '../prisma/prisma.service';
import { ResendModule } from '../resend/resend.module';

@Module({
  imports: [ResendModule],
  providers: [OrderService, OrderResolver, PrismaService],
  exports: [OrderService],
})
export class OrderModule {}
