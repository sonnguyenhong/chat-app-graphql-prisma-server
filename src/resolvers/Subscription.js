const { AuthenticationError } = require('apollo-server-core')
const { withFilter } = require('graphql-subscriptions')
const { verifyToken } = require('../utils/auth.utils')
const pubsub = require('../config/pubSubConfig')
const { subscribe } = require('graphql')

const newMessage = {
    subscribe: withFilter((_, __, context) => {
        if(!context.user) {
            throw new AuthenticationError("Unauthenticated")
        }
        return pubsub.asyncIterator(['NEW_MESSAGE'])
    }, (payload, variables, context) => {
        if(payload.newMessage.from === context.user.username || payload.newMessage.to === context.user.username) {
            return true
        }
        return false 
    })

    // subscribe: withFilter(
    //     () => pubsub.asyncIterator(['NEW_MESSAGE']),
    //     (payload, variables) => {
    //         // payload - payload of the event that was publish
    //         // variables - object containing all arguments the client provided when init their subscription
    //         console.log('payload: ', payload)
    //         console.log('variables: ', variables)
    //         return variables.username === payload.newMessage.from || variables.username === payload.newMessage.to
    //     }
    // )
}

module.exports = {
    newMessage,
}