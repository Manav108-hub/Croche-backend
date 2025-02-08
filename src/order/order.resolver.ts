import { Resolver, Query, Args } from '@nestjs/graphql';
import { OrderService } from './order.service';
import { Order } from './model/order.model';

@Resolver(() => Order)
export class OrderResolver {
  constructor(private readonly orderService: OrderService) {}

  @Query(() => [Order], { name: 'orders' })
  async getOrders() {
    return this.orderService.getOrders();
  }

  @Query(() => Order, { name: 'order', nullable: true })
  async getOrderById(@Args('id', { type: () => String }) id: string) {
    return this.orderService.getOrderById(id);
  }
}
