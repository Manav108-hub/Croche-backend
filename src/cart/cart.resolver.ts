import { Resolver, Query, Mutation, Args, Subscription, ResolveField, Float, Parent } from '@nestjs/graphql';
import { CartService } from './cart.service';
import { Cart } from './model/cart.model';
import { CartItem } from './model/cart-item.model';
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