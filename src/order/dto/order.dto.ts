import { IsString, IsNumber, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import {  OrderStatus , Size } from '@prisma/client';


class OrderItemDto {
  @IsString()
  id: string;

  @IsString()
  productId: string;

  @IsString()
  orderId: string;

  @IsNumber()
  quantity: number;

  @IsEnum(Size)
  size: Size;

  @IsNumber()
  price: number;
}

export class OrderDto {
  @IsString()
  id: string;

  @IsString()
  userId: string;

  @IsString()
  userDetailsId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsNumber()
  totalAmount: number;

  @IsEnum(OrderStatus)
  status: OrderStatus;
}
