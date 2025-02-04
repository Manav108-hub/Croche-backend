import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AddToCartInput } from './dto/cart.dto';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  private async calculateCartTotal(cart: any): Promise<number> {
    return cart.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
  }

  async getCartByUserId(userId: string) {
    const cart = await this.prisma.cart.findFirst({ // Use findFirst instead of findUnique
      where: { userId, isOrdered: false },  // Find active cart (not ordered)
      include: { items: { include: { product: true } } },
    });
  
    if (!cart) return null;
    const total = await this.calculateCartTotal(cart);
    return { ...cart, total };
  }
  

  async addToCart(input: AddToCartInput) {
    try {
      // 1. Verify user exists
      const user = await this.prisma.user.findUnique({
        where: { id: input.userId }
      });
      
      if (!user) {
        throw new NotFoundException(`User with ID ${input.userId} not found`);
      }
  
      // 2. Verify product exists
      const product = await this.prisma.product.findUnique({
        where: { id: input.productId }
      });
      
      if (!product) {
        throw new NotFoundException(`Product with ID ${input.productId} not found`);
      }
  
      // 3. Find or create cart
      let cart = await this.prisma.cart.findUnique({
        where: { userId: input.userId },
        include: { 
          items: {
            include: {
              product: true
            }
          } 
        }
      });
  
      if (!cart || cart.isOrdered) {
        cart = await this.prisma.cart.create({
          data: { 
            userId: input.userId, 
            isOrdered: false,
          },
          include: { 
            items: {
              include: {
                product: true
              }
            } 
          }
        });
      }
  
      // 4. Find price for the product size
      const price = await this.prisma.price.findFirst({
        where: { 
          productId: input.productId,
          size: input.size
        }
      });
  
      if (!price) {
        throw new NotFoundException(
          `Price not found for product ${input.productId} with size ${input.size}`
        );
      }
  
      try {
        // 5. Find existing cart item
        const existingItem = cart.items.find(item => 
          item.productId === input.productId && 
          item.size === input.size
        );
  
        if (existingItem) {
          // 6a. Update existing cart item
          await this.prisma.cartItem.update({
            where: { id: existingItem.id },
            data: { 
              quantity: { increment: input.quantity }
            },
          });
        } else {
          // 6b. Create new cart item with size handled similar to product creation
          await this.prisma.cartItem.create({
            data: {
              cart: {
                connect: { id: cart.id }
              },
              product: {
                connect: { id: input.productId }
              },
              size: input.size,
              price: price.value,
              quantity: input.quantity,
            },
          });
        }
      } catch (error) {
        console.error('Error updating/creating cart item:', error);
        throw new Error(`Failed to update cart item: ${error.message}`);
      }
  
      // 7. Get updated cart
      const updatedCart = await this.prisma.cart.findUnique({
        where: { id: cart.id },
        include: { 
          items: { 
            include: { 
              product: {
                include: {
                  images: true
                }
              } 
            } 
          } 
        },
      });
  
      if (!updatedCart) {
        throw new Error('Failed to fetch updated cart');
      }
  
      return { 
        ...updatedCart, 
        total: await this.calculateCartTotal(updatedCart) 
      };
  
    } catch (error) {
      console.error('Cart update error:', error);
      throw new Error(`Failed to update cart: ${error.message}`);
    }
  }

  async removeCartItem(cartItemId: string) {
    const cartItem = await this.prisma.cartItem.delete({
      where: { id: cartItemId },
      include: { cart: true },
    });

    const updatedCart = await this.prisma.cart.findUnique({
      where: { id: cartItem.cart.id },
      include: { items: { include: { product: true }} },
    });

    return { ...updatedCart, total: await this.calculateCartTotal(updatedCart) };
  }
}
