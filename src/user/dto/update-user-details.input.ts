// src/user/dto/update-user-details.input.ts
import { InputType, Field, Int } from '@nestjs/graphql';
import { IsString, IsOptional, IsInt, MinLength, Matches } from 'class-validator';

@InputType()
export class UpdateUserDetailsInput {
  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  @MinLength(5, { message: 'Address must be at least 5 characters long' })
  address?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  @MinLength(2, { message: 'City must be at least 2 characters long' })
  city?: string;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsOptional()
  pincode?: number;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  @MinLength(2, { message: 'Country must be at least 2 characters long' })
  country?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  @Matches(/^\+?[0-9]{10,15}$/, {
    message: 'Phone number must be between 10 and 15 digits, can start with +'
  })
  phone?: string;
}