const {ApolloServer} = require('apollo-server')
const {PrismaClient} = require('@prisma/client')
const fs = require('fs')
const path = require('path')
require('dotenv').config()

const Mutation = require('./resolvers/Mutation')
const Query = require('./resolvers/Query')
const Subscription = require('./resolvers/Subscription')
const Message = require('./resolvers/Message')
const User = require('./resolvers/User')

const prisma = new PrismaClient()

// Import resolvers 
const resolvers = {
    Mutation,
    Query,
    Subscription,
    Message,
    User
}

const server = new ApolloServer({
    typeDefs: fs.readFileSync(
        path.join(__dirname, 'schema.graphql'),
            'utf8'
    ),
    resolvers,
    context: ({req}) => {
        return {
            req,
            prisma,
        }
    }
});

server.listen().then(({ url }) => {
    console.log(`🚀 Server ready at ${url}`);
});