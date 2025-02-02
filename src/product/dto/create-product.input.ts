import { InputType, Field, Int, Float, ID } from '@nestjs/graphql';
import { Size } from '@prisma/client';
import { IsString, IsNumber, IsOptional, IsArray, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

@InputType()
class PriceInput {
  @Field(() => Size)
  @IsEnum(Size)
  size: Size;

  @Field(() => Float)
  @IsNumber()
  value: number;
}

@InputType()
class ImageInput {
  @Field(() => ID)
  @IsString()
  id: string;
}

@InputType()
export class CreateProductInput {
  @Field()
  @IsString()
  name: string;

  @Field()
  @IsString()
  category: string;

  @Field(() => Int)
  @IsNumber()
  stock: number;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  description?: string;

  @Field(() => [PriceInput])
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PriceInput)
  prices: PriceInput[];

  @Field(() => [ImageInput])
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImageInput)
  images: ImageInput[];
}