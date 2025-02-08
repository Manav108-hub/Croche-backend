import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { User } from './user.model';
import { Order } from '../../order/model/order.model';

@ObjectType()
export class UserDetails {
  @Field(() => ID)
  id: string;

  @Field()
  userId: string;

  @Field(() => User)
  user: User;

  @Field()
  address: string;

  @Field()
  city: string;

  @Field(() => Int)
  pincode: number;

  @Field()
  country: string;

  @Field()
  phone: string;

  @Field(() => [Order], { nullable: true }) // Added orders relationship
  orders?: Order[];

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}