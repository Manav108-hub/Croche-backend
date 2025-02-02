import { ApolloDriverConfig } from "@nestjs/apollo";
import { GraphQLError } from 'graphql';

export const graphqlConfig: ApolloDriverConfig = {
    autoSchemaFile: 'schema.gql',
    sortSchema: true,
    subscriptions: {
        'graphql-ws': true, // Enable WebSockets
      },
    playground: process.env.NODE_ENV !== 'production',
    introspection: process.env.NODE_ENV !== 'production',
    context: ({ req, res }) => ({ req, res }),
    formatError: (error: GraphQLError) => {
        if (process.env.NODE_ENV === 'production') {
            if (error.extensions?.exception && typeof error.extensions.exception === 'object' && 'stacktrace' in error.extensions.exception) {
                delete (error.extensions.exception as { stacktrace?: unknown }).stacktrace;
            }
        }
        return error;
    },
};