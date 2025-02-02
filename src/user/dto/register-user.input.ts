import { InputType, Field } from '@nestjs/graphql';
import { IsBoolean, IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

@InputType()
export class RegisterUserInput {
  @Field()
  @IsString()
  name: string;

  @Field()
  @IsEmail()
  email: string;

  @Field()
  @IsString()
  @MinLength(8)
  password: string;

  @Field(() => Boolean, { nullable: true, defaultValue: false })
  @IsBoolean()
  @IsOptional()
  isAdmin?: boolean;
}
