import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AddToCartInput } from './dto/cart.dto';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async getCartByUserId(userId: string) {
    return this.prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: true } } },
    });
  }

  async addToCart(input: AddToCartInput) {
    let cart = await this.prisma.cart.findUnique({ where: { userId: input.userId } });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: {
          userId: input.userId,
          isOrdered: false,
        },
      });
    }

    const cartItem = await this.prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: input.productId,
        quantity: input.quantity,
        size: input.size,
      },
      include: { product: true },
    });

    return cartItem;
  }

  async removeCartItem(cartItemId: string) {
    const cartItem = await this.prisma.cartItem.findUnique({ where: { id: cartItemId } });

    if (!cartItem) throw new NotFoundException('Cart item not found');

    await this.prisma.cartItem.delete({ where: { id: cartItemId } });

    return { success: true };
  }
}
