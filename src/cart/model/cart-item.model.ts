import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { Product } from 'src/product/models/product.model';
import { Size } from '@prisma/client';

@ObjectType()
export class CartItem {
  @Field(() => ID)
  id: string;

  @Field()
  cartId: string;

  @Field(() => Product)
  product: Product;

  @Field()
  productId: string;

  @Field(() => Int)
  quantity: number;

  @Field(() => Size)
  size: Size;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}