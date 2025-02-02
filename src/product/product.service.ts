import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProductInput } from './dto/create-product.input';
import { UpdateProductInput } from './dto/update-product.input';

@Injectable()
export class ProductService {
    constructor(private prisma: PrismaService) {}

    async create(input: CreateProductInput) {
        try {
            const imageIds = input.images.map((image) => image.id);

            const existingImages = await this.prisma.image.findMany({
                where: { id: { in: imageIds } },
            });

            const product = await this.prisma.product.create({
                data: {
                    name: input.name,
                    category: input.category,
                    stock: input.stock,
                    description: input.description,
                    prices: {
                        create: input.prices.map(price => ({
                            size: price.size,
                            value: price.value
                        }))
                    },
                    images: {
                        connect: input.images.map((image) => ({ id: image.id }))
                    }
                },
                include: {
                    prices: true,
                    images: true
                }
            });
            return product;
        } catch (error) {
            console.error('Error creating product:', error);
            throw new InternalServerErrorException('Failed to create product');
        }
    }

    async findAll() {
        return this.prisma.product.findMany({
            include: {
                prices: true,
                images: true,
            },
        });
    }

    async findOne(id: string) {
        return this.prisma.product.findUnique({
            where: { id },
            include: {
                prices: true,
                images: true,
            },
        });
    }

    async update(id: string, input: UpdateProductInput) {
        return this.prisma.product.update({
            where: { id },
            data: input,
            include: {
                prices: true,
                images: true,
            },
        });
    }

    async delete(id: string) {
        return this.prisma.product.delete({
            where: { id },
        });
    }
}
