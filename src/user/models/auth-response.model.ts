import { ObjectType, Field } from '@nestjs/graphql';
import { User } from './user.model';

@ObjectType()
export class AuthResponse {
  @Field()
  access_token: string;

  @Field()
  user: User;
}
