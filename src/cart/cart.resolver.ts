import { Resolver, Query, Mutation, Args, Subscription, ResolveField, Float, Parent } from '@nestjs/graphql';
import { CartService } from './cart.service';
import { Cart } from './model/cart.model';
import { AddToCartInput, UpdateCartItemInput } from './dto/cart.dto';
import { PubSubService } from 'src/pubsub/pubsub.service';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from 'src/auth/guards/gql-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from 'src/user/models/user.model';

@Resolver(() => Cart)
export class CartResolver {
  constructor(
    private cartService: CartService,
    private pubSubService: PubSubService
  ) {}

  @UseGuards(GqlAuthGuard)
  @Query(() => Cart, { nullable: true })
  async getCart(@CurrentUser() user: User) {
    return this.cartService.getCartByUserId(user.id);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Cart)
  async addToCart(
    @CurrentUser() user: User,
    @Args('input') input: AddToCartInput
  ) {
    const cart = await this.cartService.addToCart(user.id, input);
    this.pubSubService.publishEvent('cartUpdated', { cartUpdated: cart });
    return cart;
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Cart)
  async updateCartItem(
    @CurrentUser() user: User,
    @Args('input') input: UpdateCartItemInput
  ) {
    const cart = await this.cartService.updateCartItem(user.id, input);
    this.pubSubService.publishEvent('cartUpdated', { cartUpdated: cart });
    return cart;
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Cart)
  async removeCartItem(
    @CurrentUser() user: User,
    @Args('cartItemId') cartItemId: string
  ) {
    const cart = await this.cartService.removeCartItem(user.id, cartItemId);
    this.pubSubService.publishEvent('cartUpdated', { cartUpdated: cart });
    return cart;
  }

  @UseGuards(GqlAuthGuard)
  @Subscription(() => Cart, {
    resolve: (payload) => payload.cartUpdated,
  })
  cartUpdated(@CurrentUser() user: User) {
    return this.pubSubService.getAsyncIterator('cartUpdated');
  }

  // Removed ResolveField for total since it's now managed by the service layer
}