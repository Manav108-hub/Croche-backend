import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterUserInput } from 'src/user/dto/register-user.input';
import * as bcrypt from 'bcryptjs';
import { LoginInput } from 'src/user/dto/login.input';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(input: RegisterUserInput) {
    const existingUser = await this.prisma.user.findUnique({
        where: { email: input.email }
    });

    if (existingUser) {
        throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(input.password, 10);
    
    const user = await this.prisma.user.create({
        data: {
            name: input.name,
            email: input.email,
            password: hashedPassword,
            isAdmin: input.isAdmin || false // Add this line
        },
        select: {
            id: true,
            name: true,
            email: true,
            isAdmin: true,
            createdAt: true,
            updatedAt: true
        }
    });

    const payload = { email: user.email, sub: user.id, isAdmin: user.isAdmin };
    
    return {
        access_token: this.jwtService.sign(payload),
        user
    };
  }

  async login(input: LoginInput) {
    const user = await this.prisma.user.findUnique({
        where: { email: input.email },
        select: {
            id: true,
            email: true,
            password: true,
            name: true,
            isAdmin: true,
            createdAt: true,
            updatedAt: true,
            userDetails: true
        }
    });

    if (!user || !(await bcrypt.compare(input.password, user.password))) {
        throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { email: user.email, sub: user.id, isAdmin: user.isAdmin };
    
    const { password, ...result } = user;
    
    return {
        access_token: this.jwtService.sign(payload),
        user: result
    };
  }
}
