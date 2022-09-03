const prisma = require('../config/prismaConfig')
const createdAt = (parent, args, context, info) => {
    return parent.createdAt.toISOString()
}

const reactions = async (parent, args, context, info) => {
    const reactions = await prisma.reaction.findMany({
        where: {
            messageId: parent.id
        }
    })
    return reactions
}

module.exports = {
    createdAt,
    reactions
}