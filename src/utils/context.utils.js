const jwt = require('jsonwebtoken')
const {PubSub} = require('graphql-subscriptions')
const {PrismaClient} = require('@prisma/client')

const pubsub = new PubSub()
const prisma = new PrismaClient()
module.exports = (context) => {
    let token

    if(context.req && context.req.headers.authorization) {
        token = context.req.headers.authorization.replace('Bearer ', '')
    } else if(context.connection && context.connection.context.Authorization) {
        token = context.connection.context.Authorization.replace('Bearer ', '')
    }

    if(token) {
        jwt.verify(token, process.env.SECRET_KEY, (err, decodedToken) => {
            context.user = decodedToken
        })
    }

    // context.pubsub = pubsub
    // console.log(pubsub)
    // context.prisma = prisma
    
    // console.log('context: ', context.user)

    return context
}