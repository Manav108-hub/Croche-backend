import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateUserInput } from './dto/update-user.input';
import { UpdateUserDetailsInput } from './dto/update-user-details.input';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserService {
    constructor(private prisma: PrismaService) {}

    async findOne(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            include: {
                userDetails: true,
                orders: {
                    include: {
                        orderItems: true
                    }
                }
            }
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return user;
    }

    async findByEmail(email: string) {
        const user = await this.prisma.user.findUnique({
            where: { email },
            include: { userDetails: true }
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return user;
    }

    async update(id: string, input: UpdateUserInput) {
        // Check if user exists
        const user = await this.prisma.user.findUnique({
            where: { id }
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // If updating email, check if new email already exists
        if (input.email) {
            const emailExists = await this.prisma.user.findUnique({
                where: { email: input.email }
            });
            if (emailExists && emailExists.id !== id) {
                throw new BadRequestException('Email already in use');
            }
        }

        // If updating password, hash it
        let data = { ...input };
        if (input.password) {
            data.password = await bcrypt.hash(input.password, 10);
        }

        return this.prisma.user.update({
            where: { id },
            data,
            include: { 
                userDetails: true,
                orders: {
                    include: {
                        orderItems: true
                    }
                }
            }
        });
    }

    async updateUserDetails(userId: string, input: UpdateUserDetailsInput) {
        // Check if user exists
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { userDetails: true }
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (user.userDetails) {
            // Update existing user details
            return this.prisma.userDetails.update({
                where: { userId },
                data: {
                    ...(input.address && { address: input.address }),
                    ...(input.city && { city: input.city }),
                    ...(input.pincode && { pincode: input.pincode }),
                    ...(input.country && { country: input.country }),
                    ...(input.phone && { phone: input.phone })
                }
            });
        } else {
            // Create new user details
            return this.prisma.userDetails.create({
                data: {
                    userId,
                    address: input.address || '',
                    city: input.city || '',
                    pincode: input.pincode || 0,
                    country: input.country || '',
                    phone: input.phone || ''
                }
            });
        }
    }

    async delete(id: string) {
        // Check if user exists
        const user = await this.prisma.user.findUnique({
            where: { id }
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Delete user and all related data
        await this.prisma.$transaction([
            // Delete user details
            this.prisma.userDetails.deleteMany({
                where: { userId: id }
            }),
            // Delete order items
            this.prisma.orderItem.deleteMany({
                where: {
                    order: {
                        userId: id
                    }
                }
            }),
            // Delete orders
            this.prisma.order.deleteMany({
                where: { userId: id }
            }),
            // Finally delete the user
            this.prisma.user.delete({
                where: { id }
            })
        ]);

        return { message: 'User deleted successfully' };
    }

    async validatePassword(id: string, currentPassword: string): Promise<boolean> {
        const user = await this.prisma.user.findUnique({
            where: { id }
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return bcrypt.compare(currentPassword, user.password);
    }

    async changePassword(id: string, currentPassword: string, newPassword: string) {
        const isValid = await this.validatePassword(id, currentPassword);
        
        if (!isValid) {
            throw new BadRequestException('Current password is incorrect');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        return this.prisma.user.update({
            where: { id },
            data: {
                password: hashedPassword
            },
            select: {
                id: true,
                email: true,
                name: true,
                updatedAt: true
            }
        });
    }
}