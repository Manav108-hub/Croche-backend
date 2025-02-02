import { ObjectType, Field, ID, Int } from '@nestjs/graphql';

@ObjectType()
export class ProductImage {
  @Field(() => ID)
  id: string;

  @Field()
  public_id: string;

  @Field()
  url: string;

  @Field(() => Int)
  width: number;

  @Field(() => Int)
  height: number;

  @Field()
  format: string;

  @Field(() => Date)
  createdAt: Date;
}