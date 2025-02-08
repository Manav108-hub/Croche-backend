import { InputType, Field, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsString, IsInt, Min, IsEnum } from 'class-validator';
import { Size } from '@prisma/client';

@InputType()
export class AddToCartInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  productId: string;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  quantity: number;

  @Field(() => Size)
  @IsEnum(Size)
  size: Size;
}

@InputType()
export class UpdateCartItemInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  cartItemId: string;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  newQuantity: number;
}