import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsNotEmpty } from 'class-validator';

@InputType()
export class UploadImageInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  file: string;
}