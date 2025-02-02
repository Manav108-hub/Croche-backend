import { ObjectType, Field, ID } from '@nestjs/graphql';
import { UserDetails } from './user-details.model';

@ObjectType()
export class User {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  email: string;

  @Field()
  isAdmin: boolean;

  @Field(() => UserDetails, { nullable: true })
  userDetails?: UserDetails;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
