import { registerEnumType } from '@nestjs/graphql';
import { Size } from '@prisma/client';

registerEnumType(Size, {
  name: 'Size',
  description: 'Size options for products',
});