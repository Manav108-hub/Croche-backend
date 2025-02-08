import { OrderStatus } from './order-status.enum'; 
import { OrderItem } from './order-item.model';
import { IsString, IsNumber, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class Order {
  @IsString()
  id: string;

  @IsString()
  userId: string;

  @IsString()
  userDetailsId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItem)
  items: OrderItem[];

  @IsNumber()
  totalAmount: number;

  @IsEnum(OrderStatus)
  status: OrderStatus;
}
