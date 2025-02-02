import { ObjectType, Field, ID, Int } from '@nestjs/graphql';

@ObjectType()
export class Image {
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

  @Field({ nullable: true })
  productId?: string;

  @Field()
  createdAt: Date;
}
