import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AddToCartInput, UpdateCartItemInput } from './dto/cart.dto';
import { Cart, CartItem, Product, Size, Price, Image } from '@prisma/client';

type ProductWithDetails = Product & {
  prices: Price[];
  images: Image[];
};

type CartItemWithDetails = CartItem & {
  product: ProductWithDetails;
};

type CartWithItems = Cart & {
  items: CartItemWithDetails[];
};

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  private getItemPrice(item: CartItemWithDetails): number {
    const price = item.product.prices.find(p => p.size === item.size);
    if (!price) {
      throw new Error(`Price not found for product ${item.productId} size ${item.size}`);
    }
    return price.value;
  }

  private calculateCartTotal(items: CartItemWithDetails[]): number {
    return items.reduce((sum, item) => {
      const price = this.getItemPrice(item);
      return sum + (price * item.quantity);
    }, 0);
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

    return cart;
  }

  async addToCart(userId: string, input: AddToCartInput): Promise<CartWithItems> {
    return this.prisma.$transaction(async (tx) => {
      // Find or create cart
      let cart = await tx.cart.findUnique({
        where: { userId },
        include: { items: true }
      });

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
        // Update existing item quantity
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

      // Get updated cart with all items and details
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

      return updatedCart;
    });
  }

  async updateCartItem(userId: string, input: UpdateCartItemInput): Promise<CartWithItems> {
    return this.prisma.$transaction(async (tx) => {
      const cartItem = await tx.cartItem.findUnique({
        where: { id: input.cartItemId },
        include: { 
          cart: true,
          product: {
            include: {
              prices: true
            }
          }
        }
      });
      
      if (!cartItem?.cart || cartItem.cart.userId !== userId) {
        throw new ForbiddenException('Cart item not found');
      }

      if (input.newQuantity < 1) {
        throw new ForbiddenException('Quantity must be at least 1');
      }

      if (cartItem.product.stock < input.newQuantity) {
        throw new ForbiddenException('Insufficient stock');
      }
      
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

      return updatedCart;
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

      return updatedCart;
    });
  }
}