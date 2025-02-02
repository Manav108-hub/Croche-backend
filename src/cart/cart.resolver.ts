import { Resolver, Query, Mutation, Args, Subscription } from '@nestjs/graphql';
import { CartService } from './cart.service';
import { Cart } from './model/cart.model';
import { AddToCartInput } from './dto/cart.dto';
import { PubSub, PubSubEngine } from 'graphql-subscriptions';
import { PubsubserviceService } from 'src/pubsubservice/pubsubservice.service';

const pubSub: PubSubEngine = new PubSub();  // Ensure it's typed as PubSubEngine

@Resolver(() => Cart)
export class CartResolver {
    constructor(
        private cartService: CartService,
        private pubSubService: PubsubserviceService,  // Inject PubSubService
      ) {}

  @Query(() => Cart, { nullable: true })
  async getCart(@Args('userId') userId: string) {
    return this.cartService.getCartByUserId(userId);
  }

  @Mutation(() => Cart)
  async addToCart(@Args('input') input: AddToCartInput) {
    const cartItem = await this.cartService.addToCart(input);
    this.pubSubService.publishEvent('cartUpdated', { cartUpdated: cartItem });
    return cartItem;
  }

  @Mutation(() => Boolean)
  async removeCartItem(@Args('cartItemId') cartItemId: string) {
    await this.cartService.removeCartItem(cartItemId);
    this.pubSubService.publishEvent('cartUpdated', { cartUpdated: null });
    return true;
  }

  @Subscription(() => Cart, {
    resolve: (payload) => payload.cartUpdated,
  })
  cartUpdated() {
    return this.pubSubService.getAsyncIterator('cartUpdated');  // Now using asyncIterator correctly
  }
}
