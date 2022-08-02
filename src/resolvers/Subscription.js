const pubsub = require('../config/pubSubConfig')

const newMessage = {
    subscribe: () => pubsub.asyncIterator(['NEW_MESSAGE'])
}

module.exports = {
    newMessage,
}