import { Resolver, Query, Mutation, Args, ResolveField, Float, Parent } from '@nestjs/graphql';
import { CartService } from './cart.service';
import { Cart } from './model/cart.model';
import { CartItem } from './model/cart-item.model';
import { AddToCartInput, UpdateCartItemInput } from './dto/cart.dto';
import { PubSubService } from 'src/pubsub/pubsub.service';

@Resolver(() => Cart)
export class CartResolver {
  constructor(
    private cartService: CartService,
    private pubSubService: PubSubService
  ) {}

  @Query(() => Cart, { nullable: true })
  async getCart(@Args('userId') userId: string) {
    return this.cartService.getCartByUserId(userId);
  }

  @Mutation(() => Cart)
  async addToCart(@Args('input') input: AddToCartInput) {
    const cart = await this.cartService.addToCart(input.userId, input);
    this.pubSubService.publishEvent('cartUpdated', { cartUpdated: cart });
    return cart;
  }

  @Mutation(() => Cart)
  async updateCartItem(
    @Args('userId') userId: string,
    @Args('input') input: UpdateCartItemInput
  ) {
    const cart = await this.cartService.updateCartItem(userId, input);
    this.pubSubService.publishEvent('cartUpdated', { cartUpdated: cart });
    return cart;
  }

  @Mutation(() => Cart)
  async removeCartItem(
    @Args('userId') userId: string,
    @Args('cartItemId') cartItemId: string
  ) {
    const cart = await this.cartService.removeCartItem(userId, cartItemId);
    this.pubSubService.publishEvent('cartUpdated', { cartUpdated: cart });
    return cart;
  }

  @ResolveField('total', () => Float)
  async total(@Parent() cart: Cart) {
    if (!cart.items?.length) return 0;
    
    return cart.items.reduce((sum, item) => {
      const price = item.product.prices.find(p => p.size === item.size);
      if (!price) return sum;
      return sum + (price.value * item.quantity);
    }, 0);
  }
}

@Resolver(() => CartItem)
export class CartItemResolver {
  @ResolveField('price', () => Float)
  price(@Parent() cartItem: CartItem) {
    const price = cartItem.product.prices.find(p => p.size === cartItem.size);
    if (!price) {
      throw new Error(`Price not found for product ${cartItem.productId} size ${cartItem.size}`);
    }
    return price.value;
  }

  @ResolveField('subtotal', () => Float)
  subtotal(@Parent() cartItem: CartItem) {
    const price = cartItem.product.prices.find(p => p.size === cartItem.size);
    if (!price) {
      throw new Error(`Price not found for product ${cartItem.productId} size ${cartItem.size}`);
    }
    return price.value * cartItem.quantity;
  }
}