import { Resolver, Query, Mutation, Args, Subscription, ResolveField, Float, Parent } from '@nestjs/graphql';
import { CartService } from './cart.service';
import { Cart } from './model/cart.model';
import { AddToCartInput } from './dto/cart.dto';
import { PubSubService } from 'src/pubsub/pubsub.service';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from 'src/auth/guards/gql-auth.guard';
import { AdminGuard } from 'src/common/guards/admin.guard';

@Resolver(() => Cart)
export class CartResolver {
    constructor(
        private cartService: CartService,
        private pubSubService: PubSubService
      ) {}

  @Query(() => Cart, { nullable: true })
  @UseGuards(GqlAuthGuard, AdminGuard)
  async getCart(@Args('userId') userId: string) {
    return this.cartService.getCartByUserId(userId);
  }

  @Mutation(() => Cart)
  @UseGuards(GqlAuthGuard, AdminGuard)
  async addToCart(@Args('input') input: AddToCartInput) {
    const cart = await this.cartService.addToCart(input);
    this.pubSubService.publishEvent('cartUpdated', { cartUpdated: cart });
    return cart;
  }

  @Mutation(() => Cart)
  @UseGuards(GqlAuthGuard, AdminGuard)
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
