import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProductInput } from './dto/create-product.input';
import { UpdateProductInput } from './dto/update-product.input';
import { ProductFilterInput } from './dto/filter-product.input';
import { contains } from 'class-validator';

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

    async findFiltered(filter: ProductFilterInput) {
        const where: any = {};

        if (filter.search) {
            where.OR = [
                { name: { contains: filter.search, mode: 'insensitive' } },
                { description: { contains: filter.search, mode: 'insensitive' } }
            ];
        }

        if (filter.category) {
            where.category = filter.category;
        }

        if (filter.ids && filter.ids.length > 0) {
            where.id = { in: filter.ids };
        }

        if (filter.inStock !== undefined) {
            where.stock = filter.inStock ? { gt: 0 } : { equals: 0 };
        }

        if (filter.sizes && filter.sizes.length > 0) {
            where.prices = {
                some: {
                    size: { in: filter.sizes }
                }
            };
        }

        if (filter.minPrice !== undefined || filter.maxPrice !== undefined) {
            where.prices = {
                ...where.prices,
                some: {
                    ...(where.prices?.some || {}),
                    value : {
                        ...(filter.minPrice !== undefined ? { gte: filter.minPrice } : {}),
                        ...(filter.maxPrice !== undefined ? { lte: filter.maxPrice } : {})
                    }
                }
            };
        }

        return this.prisma.product.findMany({
            where,
            include: {
                prices: true,
                images: true,
            },
            skip: filter.skip || 0,
            take: filter.limit || undefined,
        });
    }
}
