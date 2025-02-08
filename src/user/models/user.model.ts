import { ObjectType, Field, ID } from '@nestjs/graphql';
import { UserDetails } from './user-details.model';
import { Order } from '../../order/model/order.model';
import { Cart } from '../../cart/model/cart.model';

@ObjectType()
export class User {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  email: string;

  @Field()
  password: string; // Added password field as it exists in the Prisma schema

  @Field()
  isAdmin: boolean;

  @Field(() => [Order], { nullable: true }) // Added orders relationship
  orders?: Order[];

  @Field(() => UserDetails, { nullable: true })
  userDetails?: UserDetails;

  @Field(() => Cart, { nullable: true }) // Added cart relationship
  cart?: Cart;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}