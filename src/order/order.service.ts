import { 
  ConflictException, 
  Injectable, 
  NotFoundException,
  Logger 
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ResendService } from '../resend/resend.service';
import { Order, OrderStatus, Size } from '@prisma/client';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    private prisma: PrismaService,
    private resendService: ResendService
  ) {}

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
      // 1. Validate user and user details exist
      const [user, userDetails] = await Promise.all([
        prisma.user.findUnique({ 
          where: { id: input.userId },
          select: { id: true, email: true }
        }),
        prisma.userDetails.findUnique({ 
          where: { id: input.userDetailsId },
          select: { id: true }
        }),
      ]);

      if (!user) throw new NotFoundException('User not found');
      if (!userDetails) throw new NotFoundException('User details not found');

      // 2. Get products with prices and validate stock
      const itemsWithPrices = await Promise.all(
        input.items.map(async (item) => {
          const product = await prisma.product.findUnique({
            where: { id: item.productId },
            include: { prices: true },
          });

          if (!product) {
            throw new NotFoundException(`Product ${item.productId} not found`);
          }

          const price = product.prices.find(p => p.size === item.size);
          if (!price) {
            throw new ConflictException(`Price not found for ${product.name} (${item.size})`);
          }

          if (product.stock < item.quantity) {
            throw new ConflictException(`Insufficient stock for ${product.name}`);
          }

          return {
            ...item,
            productName: product.name,
            price: price.value,
            currentStock: product.stock,
          };
        }),
      );

      // 3. Calculate total amount
      const totalAmount = parseFloat(
        itemsWithPrices
          .reduce((sum, item) => sum + (item.price * item.quantity), 0)
          .toFixed(2)
      );

      // 4. Create order
      const order = await prisma.order.create({
        data: {
          userId: input.userId,
          userDetailsId: input.userDetailsId,
          totalAmount,
          status: OrderStatus.pending,
          items: {
            createMany: {
              data: itemsWithPrices.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                size: item.size,
                price: item.price,
              })),
            },
          },
        },
        include: { 
          items: true, 
          userDetails: true,
          user: { select: { email: true, id: true } } 
        },
      });

      // 5. Update product stock
      await Promise.all(
        itemsWithPrices.map(item =>
          prisma.product.update({
            where: { id: item.productId },
            data: { stock: item.currentStock - item.quantity },
          })
        )
      );

      // 6. Send confirmation email
      try {
        await this.resendService.sendOrderConfirmationEmail(
          user.email,
          {
            orderId: order.id,
            products: itemsWithPrices.map(item => ({
              name: item.productName,
              quantity: item.quantity,
              price: item.price,
              size: item.size,
            })),
            totalAmount: order.totalAmount,
          }
        );

        // Update emailSent flag if email was sent successfully
        await prisma.order.update({
          where: { id: order.id },
          data: { emailSent: true },
        });
      } catch (emailError) {
        this.logger.error(`Email failed for order ${order.id}: ${emailError.message}`);
      }

      return order;
    },
      {
        timeout: 10000, // Increase the timeout to 10000 ms (10 seconds) or more
      },
    );
  }

  async updateOrderStatus(id: string, newStatus: OrderStatus): Promise<Order> {
    return this.prisma.$transaction(async (prisma) => {
      // 1. Get order with related data
      const order = await prisma.order.findUnique({
        where: { id },
        include: { 
          items: { 
            include: { 
              product: { select: { stock: true, name: true } } 
            } 
          },
          user: { select: { email: true } }
        },
      });

      if (!order) throw new NotFoundException('Order not found');

      // 2. Handle stock updates for cancellations
      if (newStatus === OrderStatus.cancelled && order.status !== OrderStatus.cancelled) {
        // Return items to stock when cancelling
        await Promise.all(
          order.items.map(item =>
            prisma.product.update({
              where: { id: item.productId },
              data: { stock: item.product.stock + item.quantity },
            })
          )
        );
      } else if (order.status === OrderStatus.cancelled && newStatus !== OrderStatus.cancelled) {
        // Remove items from stock when un-cancelling
        await Promise.all(
          order.items.map(async item => {
            if (item.product.stock < item.quantity) {
              throw new ConflictException(`Insufficient stock for ${item.product.name}`);
            }
            return prisma.product.update({
              where: { id: item.productId },
              data: { stock: item.product.stock - item.quantity },
            });
          })
        );
      }

      // 3. Update order status
      const updatedOrder = await prisma.order.update({
        where: { id },
        data: { status: newStatus },
        include: { 
          items: { include: { product: true } }, 
          userDetails: true,
          user: { select: { email: true } } 
        },
      });

      // 4. Send status update email for shipping/delivery
      if (order.user?.email && (newStatus === OrderStatus.shipped || newStatus === OrderStatus.delivered)) {
        try {
          await this.resendService.sendOrderStatusUpdateEmail(
            order.user.email,
            {
              orderId: updatedOrder.id,
              newStatus,
              trackingNumber: 'TRACKING_NUMBER', // Should be dynamic in production
              estimatedDelivery: new Date(Date.now() + 3 * 86400000).toDateString(),
            }
          );
        } catch (emailError) {
          this.logger.error(`Status email failed for order ${id}: ${emailError.message}`);
        }
      }

      return updatedOrder;
    });
  }

  async getOrders(): Promise<Order[]> {
    return this.prisma.order.findMany({
      include: {
        items: {
          include: {
            product: { include: { prices: true } }
          }
        },
        userDetails: true,
        user: { select: { email: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getOrderById(id: string): Promise<Order | null> {
    return this.prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: { include: { prices: true } }
          }
        },
        userDetails: true,
        user: { select: { email: true, name: true } }
      }
    });
  }
}
