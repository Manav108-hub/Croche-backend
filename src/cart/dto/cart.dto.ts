import { InputType, Field, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsString, IsInt, Min } from 'class-validator';
import { Size } from '@prisma/client';

@InputType()
export class AddToCartInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  userId: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  productId: string;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  quantity: number;

  @Field(() => Size)
  size: Size;
}
