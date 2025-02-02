import { Args, Mutation, Resolver, Query } from '@nestjs/graphql';
import { UseGuards, NotFoundException } from '@nestjs/common';
import { User } from './models/user.model';
import { UserDetails } from './models/user-details.model';
import { UserService } from './user.service';
import { AuthService } from 'src/auth/auth.service';
import { AuthResponse } from './models/auth-response.model';
import { RegisterUserInput } from './dto/register-user.input';
import { LoginInput } from './dto/login.input';
import { UpdateUserInput } from './dto/update-user.input';
import { UpdateUserDetailsInput } from './dto/update-user-details.input';
import { ChangePasswordInput } from './dto/update-user.input';
import { GqlAuthGuard } from 'src/auth/guards/gql-auth.guard';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@Resolver(() => User)
export class UserResolver {
    constructor(
        private userService: UserService,
        private authService: AuthService,
    ) {}

    // Auth Mutations
    @Mutation(() => AuthResponse)
    async register(@Args('input') input: RegisterUserInput) {
        return this.authService.register(input);
    }

    @Mutation(() => AuthResponse)
    async login(@Args('input') input: LoginInput) {
        return this.authService.login(input);
    }

    // User Queries
    @Query(() => User)
    @UseGuards(GqlAuthGuard)
    async me(@CurrentUser() user: any) {
        return this.userService.findOne(user.userId);
    }

    @Query(() => User)
    @UseGuards(GqlAuthGuard)
    async userByEmail(@Args('email') email: string) {
        return this.userService.findByEmail(email);
    }

    // User Profile Mutations
    @Mutation(() => User)
    @UseGuards(GqlAuthGuard)
    async updateUser(
        @CurrentUser() user: any,
        @Args('input') input: UpdateUserInput,
    ) {
        input.id = user.userId; // Set the ID from the authenticated user
        return this.userService.update(user.userId, input);
    }

    @Mutation(() => UserDetails)
    @UseGuards(GqlAuthGuard)
    async updateUserDetails(
        @CurrentUser() user: any,
        @Args('input') input: UpdateUserDetailsInput,
    ) {
        return this.userService.updateUserDetails(user.userId, input);
    }

    @Mutation(() => User)
    @UseGuards(GqlAuthGuard)
    async changePassword(
        @CurrentUser() user: any,
        @Args('input') input: ChangePasswordInput,
    ) {
        if (input.newPassword !== input.confirmPassword) {
            throw new Error('New password and confirmation do not match');
        }
        return this.userService.changePassword(
            user.userId,
            input.currentPassword,
            input.newPassword,
        );
    }

    // Admin Only Mutations
    @Mutation(() => User)
    @UseGuards(GqlAuthGuard, AdminGuard)
    async updateUserAdmin(
        @Args('id') id: string,
        @Args('input') input: UpdateUserInput,
    ) {
        input.id = id; // Set the ID from the argument
        return this.userService.update(id, input);
    }

    @Mutation(() => Boolean)
    @UseGuards(GqlAuthGuard, AdminGuard)
    async deleteUser(@Args('id') id: string) {
        const result = await this.userService.delete(id);
        return result.message === 'User deleted successfully';
    }

    @Mutation(() => User)
    @UseGuards(GqlAuthGuard, AdminGuard)
    async toggleUserAdmin(
        @Args('id') id: string,
        @Args('isAdmin') isAdmin: boolean,
    ) {
        const input: UpdateUserInput = {
            id,
            isAdmin
        };
        return this.userService.update(id, input);
    }

    // User Orders Query
    @Query(() => User)
    @UseGuards(GqlAuthGuard)
    async userWithOrders(@CurrentUser() user: any) {
        return this.userService.findOne(user.userId);
    }
}