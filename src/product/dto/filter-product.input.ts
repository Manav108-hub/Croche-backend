import { Field, InputType, Int } from "@nestjs/graphql";
import { Size } from "@prisma/client";

@InputType()
export class ProductFilterInput {
    @Field(() => String, { nullable: true })
    search?: string;

    @Field(() => String, { nullable: true })
    category?: string;

    @Field(() => Int, { nullable: true })
    limit?: number;

    @Field(() => Int, { nullable: true })
    skip?: number;

    @Field(() => [String], { nullable: true })
    ids?: string[];

    @Field(() => [Size], { nullable: true })
    sizes?: Size[];

    @Field(() => Boolean, { nullable: true })
    inStock?: boolean;

    @Field(() => Int, { nullable: true })
    minPrice?: number;

    @Field(() => Int, { nullable: true })
    maxPrice?: number;
}