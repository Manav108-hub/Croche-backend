import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Order } from '@prisma/client';

@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) {}

  async getOrders(): Promise<Order[]> {
    return this.prisma.order.findMany({
      include: {
        items: {
          include: {
            product: true // Include product details if needed
          }
        },
        userDetails: true // Include user details if needed
      }
    });
  }

  async getOrderById(id: string): Promise<Order | null> {
    return this.prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true // Include product details if needed
          }
        },
        userDetails: true // Include user details if needed
      }
    });
  }
}