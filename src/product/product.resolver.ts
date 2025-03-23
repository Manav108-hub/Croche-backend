import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Product } from './models/product.model';
import { ProductService } from './product.service';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from 'src/auth/guards/gql-auth.guard';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { CreateProductInput } from './dto/create-product.input';
import { UpdateProductInput } from './dto/update-product.input';
import { ProductFilterInput } from './dto/filter-product.input';

@Resolver(() => Product)
export class ProductResolver {
    constructor(private productService: ProductService) {}

    @Query(() => [Product])
    async products() {
        return this.productService.findAll();
    }

    @Query(() => Product)
    async product(@Args('id') id: string) {
        return this.productService.findOne(id);
    }

    @Query(() => [Product], { name: 'filteredProducts' })
    async getFilteredProducts(@Args('filter') filter: ProductFilterInput) {
        return this.productService.findFiltered(filter);
    }

    @Mutation(() => Product)
    @UseGuards(GqlAuthGuard, AdminGuard)
    async createProduct(@Args('input') input: CreateProductInput) {
        return this.productService.create(input);
    }

    @Mutation(() => Product)
    @UseGuards(GqlAuthGuard, AdminGuard)
    async updateProduct(@Args('input') input: UpdateProductInput) {
        return this.productService.update(input.id, input)
    }

    @Mutation(() => Product)
    @UseGuards(GqlAuthGuard, AdminGuard)
    async deleteProduct(@Args('id') id: string) {
        return this.productService.delete(id);
    }
}
