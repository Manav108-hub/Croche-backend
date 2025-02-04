import { ObjectType, Field, ID, Int, registerEnumType, Float } from '@nestjs/graphql';
import { Product } from 'src/product/models/product.model';
import { Size } from '@prisma/client';

registerEnumType(Size, {
  name: 'Size',
  description: 'Available product sizes',
  valuesMap: {
    small: {
      description: 'Small size',
    },
    medium: {
      description: 'Medium size',
    },
    large: {
      description: 'Large size',
    },
  },
});

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

  @Field(() => Float)
  price: number;

  @Field(() => Int)
  quantity: number;

  @Field(() => Size)
  size: Size;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
