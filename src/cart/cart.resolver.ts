import { Resolver, Query, Mutation, Args, Subscription, ResolveField, Float, Parent } from '@nestjs/graphql';
import { CartService } from './cart.service';
import { Cart } from './model/cart.model';
import { AddToCartInput } from './dto/cart.dto';
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
    const cart = await this.cartService.addToCart(input);
    this.pubSubService.publishEvent('cartUpdated', { cartUpdated: cart });
    return cart;
  }

  @Mutation(() => Cart)
  async removeCartItem(@Args('cartItemId') cartItemId: string) {
    const cart = await this.cartService.removeCartItem(cartItemId);
    this.pubSubService.publishEvent('cartUpdated', { cartUpdated: cart });
    return cart;
  }

  @Subscription(() => Cart, {
    resolve: (payload) => payload.cartUpdated,
  })
  cartUpdated() {
    return this.pubSubService.getAsyncIterator('cartUpdated');
  }

  @ResolveField(() => Float)
  total(@Parent() cart: Cart) {
    return cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }
}
