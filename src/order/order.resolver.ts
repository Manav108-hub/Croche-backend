import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { OrderService } from './order.service';
import {  OrderItem } from './model/order-item.model';
import { Order } from './model/order.model';
import { OrderStatus } from '@prisma/client';
import { CreateOrderInput, UpdateOrderStatusInput } from './dto/order.dto';
import { UsePipes, ValidationPipe } from '@nestjs/common';

@Resolver(() => Order)
export class OrderResolver {
  constructor(private readonly orderService: OrderService) {}

  @Mutation(() => Order)
  @UsePipes(new ValidationPipe({ transform: true }))
  async createOrder(@Args('input') input: CreateOrderInput) {
    return this.orderService.createOrder({
      userId: input.userId,
      userDetailsId: input.userDetailsId,
      items: input.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        size: item.size
      }))
    });
  }

  @Mutation(() => Order)
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateOrderStatus(@Args('input') input: UpdateOrderStatusInput) {
    return this.orderService.updateOrderStatus(input.orderId, input.status);
  }

  @Query(() => [Order], { name: 'orders' })
  async getOrders() {
    return this.orderService.getOrders();
  }


  @Query(() => Order, { name: 'order', nullable: true })
  async getOrderById(@Args('id', { type: () => ID }) id: string) {
    return this.orderService.getOrderById(id);
  }
}