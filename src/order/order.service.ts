import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Order, OrderStatus, Prisma, Size } from '@prisma/client';

@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) {}

  async createOrder(input: {
    userId: string;
    userDetailsId: string;
    items: Array<{
      productId: string;
      quantity: number;
      size: Size;
    }>;
  }): Promise<Order> {
    return this.prisma.$transaction(async (prisma) => {
      // 1. Validate user and user details
      const [user, userDetails] = await Promise.all([
        prisma.user.findUnique({ where: { id: input.userId } }),
        prisma.userDetails.findUnique({ where: { id: input.userDetailsId } }),
      ]);

      if (!user) throw new NotFoundException('User not found');
      if (!userDetails) throw new NotFoundException('User details not found');

      // 2. Process items and validate stock/price
      const itemsWithPrices = await Promise.all(
        input.items.map(async (item) => {
          const product = await prisma.product.findUnique({
            where: { id: item.productId },
            include: { prices: true },
          });

          if (!product) {
            throw new NotFoundException(`Product ${item.productId} not found`);
          }

          const price = product.prices.find(
            (p) => p.size === item.size,
          );

          if (!price) {
            throw new ConflictException(
              `Price not found for product ${item.productId} with size ${item.size}`,
            );
          }

          if (product.stock < item.quantity) {
            throw new ConflictException(
              `Insufficient stock for product ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`,
            );
          }

          return {
            ...item,
            price: price.value,
            currentStock: product.stock,
          };
        }),
      );

      // 3. Calculate total amount
      const totalAmount = itemsWithPrices.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      );

      // 4. Create the order
      const order = await prisma.order.create({
        data: {
          userId: input.userId,
          userDetailsId: input.userDetailsId,
          totalAmount,
          status: OrderStatus.pending,
          items: {
            createMany: {
              data: itemsWithPrices.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                size: item.size,
                price: item.price,
              })),
            },
          },
        },
        include: { items: true, userDetails: true },
      });

      // 5. Update product stock
      await Promise.all(
        itemsWithPrices.map((item) =>
          prisma.product.update({
            where: { id: item.productId },
            data: { stock: item.currentStock - item.quantity },
          }),
        ),
      );

      return order;
    });
  }

  async updateOrderStatus(
    id: string,
    newStatus: OrderStatus,
  ): Promise<Order> {
    return this.prisma.$transaction(async (prisma) => {
      const order = await prisma.order.findUnique({
        where: { id },
        include: { items: { include: { product: true } } },
      });

      if (!order) throw new NotFoundException('Order not found');

      // Handle stock adjustments for cancellations
      if (newStatus === OrderStatus.cancelled && order.status !== OrderStatus.cancelled) {
        // Restore stock
        await Promise.all(
          order.items.map((item) =>
            prisma.product.update({
              where: { id: item.productId },
              data: { stock: item.product.stock + item.quantity },
            }),
          ),
        );
      } else if (order.status === OrderStatus.cancelled && newStatus !== OrderStatus.cancelled) {
        // Re-reserve stock if uncancelling
        await Promise.all(
          order.items.map(async (item) => {
            if (item.product.stock < item.quantity) {
              throw new ConflictException(
                `Insufficient stock to uncancel order for product ${item.product.name}`,
              );
            }
            return prisma.product.update({
              where: { id: item.productId },
              data: { stock: item.product.stock - item.quantity },
            });
          }),
        );
      }

      return prisma.order.update({
        where: { id },
        data: {
          status: newStatus,
          updatedAt: new Date(),
        },
        include: { items: true, userDetails: true },
      });
    });
  }

  // In getOrders() and getOrderById() methods
async getOrders(): Promise<Order[]> {
  return this.prisma.order.findMany({
    include: {
      items: {
        include: {
          product: {
            include: {
              prices: true // Add this
            }
          }
        }
      },
      userDetails: true,
      user: true // Add this for user relation
    }
  });
}

async getOrderById(id: string): Promise<Order | null> {
  return this.prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: {
            include: {
              prices: true // Add this
            }
          }
        }
      },
      userDetails: true,
      user: true // Add this for user relation
    }
  });
}
}