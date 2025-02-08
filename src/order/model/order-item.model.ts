import { ObjectType, Field, ID, Int, Float, registerEnumType } from '@nestjs/graphql';
import { Size } from '@prisma/client';
import { IsString, IsNumber, IsEnum } from 'class-validator';
import { Product } from 'src/product/models/product.model';

registerEnumType(Size, {
  name: 'Size',
  description: 'Available product sizes',
});

@ObjectType()
export class OrderItem {
  @Field(() => ID)
  @IsString()
  id: string;

  @Field()
  @IsString()
  orderId: string;

  @Field()
  @IsString()
  productId: string;

  @Field(() => Product, { nullable: true })
  product?: Product;

  @Field(() => Int)
  @IsNumber()
  quantity: number;

  @Field(() => Size)
  @IsEnum(Size)
  size: Size;

  @Field(() => Float)
  @IsNumber()
  price: number;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
