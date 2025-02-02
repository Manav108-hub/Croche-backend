import {
  ObjectType,
  Field,
  ID,
  Float,
  registerEnumType,
} from '@nestjs/graphql';
import { Size } from '@prisma/client';

// Register the Size enum for GraphQL
registerEnumType(Size, {
  name: 'Size',
  description: 'Available product sizes',
  valuesMap: {
    small: {
      description: 'Small size',
    },
    medium: {
      description: 'Medium size',
    },
    large: {
      description: 'Large size',
    },
  },
});

@ObjectType()
export class Price {
  @Field(() => ID)
  id: string;

  @Field(() => Size)
  size: Size;

  @Field(() => Float)
  value: number;

  @Field(() => ID)
  productId: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}