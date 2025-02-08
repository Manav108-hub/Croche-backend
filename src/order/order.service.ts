import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Order } from '@prisma/client';

@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) {}

  async getOrders(): Promise<Order[]> {
    return this.prisma.order.findMany({
      include: { items: true }, // Fetch OrderItems inside Order
    });
  }

  async getOrderById(id: string): Promise<Order | null> {
    return this.prisma.order.findUnique({
      where: { id },
      include: { items: true }, // Fetch OrderItems inside Order
    });
  }
}
