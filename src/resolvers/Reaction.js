const prisma = require('../config/prismaConfig')
const createdAt = (parent, args, context, info) => {
    return parent.createdAt.toISOString()
}

const message = async (parent, args, context) => {
    const message = await prisma.message.findUnique({
        where: {
            id: parent.messageId
        }
    })
    return message
}

const user = async (parent, args, context) => {
    return await prisma.user.findUnique({
        where: {
            id: parent.userId
        }
    })
}

module.exports = {
    createdAt,
    message,
    user
}