import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AddToCartInput, UpdateCartItemInput } from './dto/cart.dto';
import { Cart, CartItem, Product, Size, Price, Image } from '@prisma/client';

type ProductWithDetails = Product & {
  prices: Price[];
  images: Image[];
};

type CartItemWithProduct = CartItem & {
  product: ProductWithDetails;
  prices: Price[];
};

type CartWithItems = Cart & {
  items: CartItemWithProduct[];
  total: number;
};

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  private calculateCartTotal(items: CartItemWithProduct[]): number {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  async getCartByUserId(userId: string): Promise<CartWithItems | null> {
    const cart = await this.prisma.cart.findUnique({
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
        }
      }
    });

    return cart ? { ...cart, total: this.calculateCartTotal(cart.items) } : null;
  }

  async addToCart(userId: string, input: AddToCartInput): Promise<CartWithItems> {
    return this.prisma.$transaction(async (tx) => {
      let cart = await tx.cart.findUnique({
        where: { userId },
        include: { items: true }
      }) || await tx.cart.create({
        data: { userId },
        include: { items: true }
      });

      const product = await tx.product.findUnique({
        where: { id: input.productId },
        include: { prices: true }
      });
      
      if (!product) throw new NotFoundException('Product not found');
      if (product.stock < input.quantity) throw new Error('Insufficient stock');
      
      const price = product.prices.find(p => p.size === input.size);
      if (!price) throw new NotFoundException('Selected size not available');

      const existingItem = cart.items.find(item => 
        item.productId === input.productId && 
        item.size === input.size
      );

      const cartItemData = {
        cartId: cart.id,
        productId: input.productId,
        size: input.size,
        price: price.value,
        quantity: input.quantity
      };

      if (existingItem) {
        await tx.cartItem.update({
          where: { id: existingItem.id },
          data: { 
            quantity: { increment: input.quantity },
            price: price.value
          }
        });
      } else {
        await tx.cartItem.create({
          data: cartItemData
        });
      }

      const updatedCart = await tx.cart.findUniqueOrThrow({
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
          }
        }
      });

      return {
        ...updatedCart,
        total: this.calculateCartTotal(updatedCart.items)
      };
    });
  }

  async updateCartItem(userId: string, input: UpdateCartItemInput): Promise<CartWithItems> {
    return this.prisma.$transaction(async (tx) => {
      const cartItem = await tx.cartItem.findUnique({
        where: { id: input.cartItemId },
        include: { cart: true }
      });
      
      if (!cartItem?.cart || cartItem.cart.userId !== userId) {
        throw new ForbiddenException('Cart item not found');
      }

      if (input.newQuantity < 1) throw new Error('Quantity must be at least 1');
      
      await tx.cartItem.update({
        where: { id: input.cartItemId },
        data: { quantity: input.newQuantity }
      });

      const updatedCart = await tx.cart.findUniqueOrThrow({
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
          }
        }
      });

      return {
        ...updatedCart,
        total: this.calculateCartTotal(updatedCart.items)
      };
    });
  }

  async removeCartItem(userId: string, cartItemId: string): Promise<CartWithItems> {
    return this.prisma.$transaction(async (tx) => {
      const cartItem = await tx.cartItem.findUnique({
        where: { id: cartItemId },
        include: { cart: true }
      });
      
      if (!cartItem?.cart || cartItem.cart.userId !== userId) {
        throw new ForbiddenException('Cart item not found');
      }

      await tx.cartItem.delete({ where: { id: cartItemId } });

      const updatedCart = await tx.cart.findUniqueOrThrow({
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
          }
        }
      });

      return {
        ...updatedCart,
        total: this.calculateCartTotal(updatedCart.items)
      };
    });
  }
}