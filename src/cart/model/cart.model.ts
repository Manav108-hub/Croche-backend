import { ObjectType, Field, ID, Float } from '@nestjs/graphql';
import { CartItem } from './cart-item.model';

@ObjectType()
export class Cart {
  @Field(() => ID)
  id: string;

  @Field()
  userId: string;

  @Field(() => [CartItem])
  items: CartItem[];

  @Field()
  isOrdered: boolean;

  @Field(() => Float)
  total: number;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}