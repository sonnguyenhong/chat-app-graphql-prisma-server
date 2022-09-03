const {ApolloServer} = require('apollo-server-express')

const {
  ApolloServerPluginDrainHttpServer,
  ApolloServerPluginLandingPageLocalDefault,
} = require('apollo-server-core')
const express = require('express')
const { WebSocketServer } = require('ws');
const { useServer } = require('graphql-ws/lib/use/ws');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const http = require('http')
const fs = require('fs')
const path = require('path')
const cors = require('cors')
require('dotenv').config()

const Mutation = require('./resolvers/Mutation')
const Query = require('./resolvers/Query')
const Subscription = require('./resolvers/Subscription')
const Message = require('./resolvers/Message')
const User = require('./resolvers/User');
const Reaction = require('./resolvers/Reaction')
const { verifyToken } = require('./utils/auth.utils');
const contextMiddleware = require('./utils/context.utils')


// Import resolvers 
const resolvers = {
    Mutation,
    Query,
    Subscription,
    Message,
    User,
    Reaction
}

const app = express()
app.use(cors())
const httpServer = http.createServer(app)

const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql',
});

const typeDefs = fs.readFileSync(
    path.join(__dirname, 'schema.graphql'),
        'utf8'
)

const schema = makeExecutableSchema({ typeDefs, resolvers });

const getDynamicContext = async (ctx, msg, args) => {
  // ctx is the graphql-ws Context where connectionParams live
  if (ctx.connectionParams.Authorization) {
    // console.log('ctx', ctx)
    const user = verifyToken(ctx.connectionParams.Authorization)
    // console.log(user)
    return { user };
  }
  // Otherwise let our resolvers know we don't have a current user
  return { user: null };
};

const serverCleanup = useServer({ 
  schema,
  context: (ctx, msg, args) => {
    return getDynamicContext(ctx, msg, args)
  } 
}, wsServer);

const server = new ApolloServer({
    schema,
    csrfPrevention: true,
    cache: 'bounded',
    plugins: [
      // Proper shutdown for the HTTP server.
      ApolloServerPluginDrainHttpServer({ httpServer }),
  
      // Proper shutdown for the WebSocket server.
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            },
          };
        },
      },
  
      ApolloServerPluginLandingPageLocalDefault({ embed: true }),
    ],
    context: contextMiddleware
});

// server.listen().then(({ url }) => {
//     console.log(`🚀 Server ready at ${url}`);
// });

// console.log('context middleware: ', contextMiddleware)

server.start()
    .then(() => {
        server.applyMiddleware({app})
        const PORT = 4000
        
        httpServer.listen(PORT, () => {
            console.log(
                `Server is now running on http://localhost:${PORT}${server.graphqlPath}`,
            );
        })  
    })
    