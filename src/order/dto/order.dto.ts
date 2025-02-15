import { InputType, Field, ID } from '@nestjs/graphql';
import { IsString, IsNumber, IsEnum, IsArray, ValidateNested, isBoolean, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { Size, OrderStatus } from '@prisma/client';

@InputType()
class OrderItemInput {
  @Field(() => ID)
  @IsString()
  productId: string;

  @Field(() => Number)
  @IsNumber()
  quantity: number;

  @Field(() => Size)
  @IsEnum(Size)
  size: Size;
}

@InputType()
export class CreateOrderInput {
  @Field(() => ID)
  @IsString()
  userId: string;

  @Field(() => Boolean)
  @IsBoolean()
  emailSent: Boolean;

  @Field(() => ID)
  @IsString()
  userDetailsId: string;

  @Field(() => [OrderItemInput])
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemInput)
  items: OrderItemInput[];
}

@InputType()
export class UpdateOrderStatusInput {
  @Field(() => ID)
  @IsString()
  orderId: string;

  @Field(() => OrderStatus)
  @IsEnum(OrderStatus)
  status: OrderStatus;
}