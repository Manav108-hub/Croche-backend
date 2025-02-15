import { ObjectType, Field, ID, Float, registerEnumType } from '@nestjs/graphql';
import { OrderStatus} from '@prisma/client';
import { IsString, IsNumber, IsEnum, IsArray, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderItem } from './order-item.model';
import { UserDetails } from 'src/user/models/user-details.model';
import { User } from 'src/user/models/user.model';

registerEnumType(OrderStatus, {
  name: 'OrderStatus',
  description: 'The status of the order',
});

@ObjectType()
export class Order {
  @Field(() => ID)
  @IsString()
  id: string;

  @Field(() => User)  // Not String!
  user: User;

  @Field(() => UserDetails)
  userDetails: UserDetails;

  @Field(() => [OrderItem])
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItem)
  items: OrderItem[];

  @Field(() => Float)
  @IsNumber()
  totalAmount: number;

  @Field(() => Boolean)
  @IsBoolean()
  emailSent: boolean;

  @Field(() => OrderStatus)
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}