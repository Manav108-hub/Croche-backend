import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { Price } from './price.model';
import { Image } from './image.model';

@ObjectType()
export class Product {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  category: string;

  @Field(() => Int)
  stock: number;

  @Field({ nullable: true })
  description?: string;

  @Field(() => [Price])
  prices: Price[];

  @Field(() => [Image])
  images: Image[];

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}