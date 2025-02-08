import { ObjectType, Field, ID, Float, registerEnumType } from '@nestjs/graphql';
import { OrderStatus } from '@prisma/client';
import { IsString, IsNumber, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderItem } from './order-item.model';

registerEnumType(OrderStatus, {
  name: 'OrderStatus',
  description: 'The status of the order',
});

@ObjectType()
export class Order {
  @Field(() => ID)
  @IsString()
  id: string;

  @Field()
  @IsString()
  userId: string;

  @Field()
  @IsString()
  userDetailsId: string;

  @Field(() => [OrderItem])
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItem)
  items: OrderItem[];

  @Field(() => Float)
  @IsNumber()
  totalAmount: number;

  @Field(() => OrderStatus)
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}