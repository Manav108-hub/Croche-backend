import { Module } from '@nestjs/common';
import { ImageService } from './image.service';
import { ImageResolver } from './image.resolver';
import { CloudinaryConfig } from 'src/config/cloudinary.config';

@Module({
  providers: [ImageService, ImageResolver, CloudinaryConfig],
  exports: [ImageService],
})
export class ImageModule {}
