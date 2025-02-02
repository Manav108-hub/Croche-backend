import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { Product } from 'src/product/models/product.model';
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

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
