import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AddToCartInput, UpdateCartItemInput } from './dto/cart.dto';
import { Cart, CartItem, Product, Size } from '@prisma/client';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  private async getProductPrice(productId: string, size: Size): Promise<number> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { prices: true }
    });

    const price = product?.prices.find(p => p.size === size);
    if (!price) {
      throw new NotFoundException(`Price not found for product ${productId} size ${size}`);
    }

    return price.value;
  }

  async addToCart(userId: string, input: AddToCartInput) {
    if (!userId) {
      throw new ForbiddenException('User ID is required');
    }

    return this.prisma.$transaction(async (tx) => {
      // First, check if cart exists
      let cart = await tx.cart.findUnique({
        where: { userId },
        include: { items: true }
      });

      // If no cart exists, create one
      if (!cart) {
        cart = await tx.cart.create({
          data: { userId },
          include: { items: true }
        });
      }

      // Get product with prices
      const product = await tx.product.findUnique({
        where: { id: input.productId },
        include: { prices: true }
      });
      
      if (!product) {
        throw new NotFoundException('Product not found');
      }

      if (product.stock < input.quantity) {
        throw new ForbiddenException('Insufficient stock');
      }
      
      // Find price for selected size
      const price = product.prices.find(p => p.size === input.size);
      if (!price) {
        throw new NotFoundException('Selected size not available');
      }

      // Check for existing cart item
      const existingItem = cart.items.find(item => 
        item.productId === input.productId && 
        item.size === input.size
      );

      if (existingItem) {
        // Update existing item with new price
        await tx.cartItem.update({
          where: { id: existingItem.id },
          data: { 
            quantity: { increment: input.quantity }
          }
        });
      } else {
        // Create new cart item
        await tx.cartItem.create({
          data: {
            cartId: cart.id,
            productId: input.productId,
            size: input.size,
            quantity: input.quantity
          }
        });
      }

      // Return updated cart with all details
      return tx.cart.findUniqueOrThrow({
        where: { id: cart.id },
        include: {
          items: {
            include: {
              product: {
                include: {
                  prices: true,
                  images: true
                }
              }
            }
          },
          user: true
        }
      });
    });
  }

  async updateCartItem(userId: string, input: UpdateCartItemInput) {
    return this.prisma.$transaction(async (tx) => {
      const cartItem = await tx.cartItem.findUnique({
        where: { id: input.cartItemId },
        include: { 
          cart: true,
          product: {
            include: { prices: true }
          }
        }
      });
      
      if (!cartItem?.cart || cartItem.cart.userId !== userId) {
        throw new ForbiddenException('Cart item not found');
      }

      if (input.quantity < 1) {
        throw new ForbiddenException('Quantity must be at least 1');
      }

      if (cartItem.product.stock < input.quantity) {
        throw new ForbiddenException('Insufficient stock');
      }
      
      await tx.cartItem.update({
        where: { id: input.cartItemId },
        data: { quantity: input.quantity }
      });

      return tx.cart.findUniqueOrThrow({
        where: { id: cartItem.cart.id },
        include: {
          items: {
            include: {
              product: {
                include: {
                  prices: true,
                  images: true
                }
              }
            }
          },
          user: true
        }
      });
    });
  }

  async removeCartItem(userId: string, cartItemId: string) {
    return this.prisma.$transaction(async (tx) => {
      const cartItem = await tx.cartItem.findUnique({
        where: { id: cartItemId },
        include: { cart: true }
      });
      
      if (!cartItem?.cart || cartItem.cart.userId !== userId) {
        throw new ForbiddenException('Cart item not found');
      }

      await tx.cartItem.delete({ where: { id: cartItemId } });

      return tx.cart.findUniqueOrThrow({
        where: { id: cartItem.cart.id },
        include: {
          items: {
            include: {
              product: {
                include: {
                  prices: true,
                  images: true
                }
              }
            }
          },
          user: true
        }
      });
    });
  }

  async getCartByUserId(userId: string) {
    return this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                prices: true,
                images: true
              }
            }
          }
        },
        user: true
      }
    });
  }
}