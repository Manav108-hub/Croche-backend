import { InputType, Field, ID } from '@nestjs/graphql';
import { IsString, IsEmail, IsOptional, MinLength, IsPhoneNumber, IsNotEmpty, IsBoolean } from 'class-validator';

@InputType()
export class UpdateUserInput {
  @Field(() => ID)
  @IsNotEmpty()
  id: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  name?: string;

  @Field({ nullable: true })
  @IsEmail({}, { message: 'Please provide a valid email' })
  @IsOptional()
  email?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isAdmin?: boolean;
}

@InputType()
export class ChangePasswordInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'New password must be at least 6 characters long' })
  newPassword: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  confirmPassword: string;
}