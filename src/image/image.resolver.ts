import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { ImageService } from './image.service';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from 'src/auth/guards/gql-auth.guard';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { ProductImage } from './models/image.model';
import { GraphQLUpload, FileUpload } from 'graphql-upload-ts';

@Resolver(() => ProductImage)
export class ImageResolver {
    constructor(private imageService: ImageService) {}

    @Mutation(() => ProductImage)
    @UseGuards(GqlAuthGuard, AdminGuard)
    async uploadImage(
        @Args('file', { type: () => GraphQLUpload, nullable: false })
        file: FileUpload
    ) {
        return this.imageService.uploadToCloudinary(file);
    }
}
