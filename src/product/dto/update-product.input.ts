import { InputType, Field, ID, Int } from '@nestjs/graphql';
import { IsOptional } from 'class-validator';

@InputType()
export class UpdateProductInput {
  @Field(() => ID)
  id: string;

  @Field({ nullable: true })
  @IsOptional()
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  category?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  stock?: number;

  @Field({ nullable: true })
  @IsOptional()
  description?: string;
}
