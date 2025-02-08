import { Size } from './size.enum'; // Define size enum separately
import { IsString, IsNumber, IsEnum } from 'class-validator';

export class OrderItem {
  @IsString()
  id: string;

  @IsString()
  orderId: string;

  @IsString()
  productId: string;

  @IsNumber()
  quantity: number;

  @IsEnum(Size)
  size: Size;

  @IsNumber()
  price: number;
}
