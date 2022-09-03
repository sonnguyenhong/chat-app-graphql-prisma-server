const { AuthenticationError, UserInputError } = require('apollo-server')
const {verifyToken} = require('../utils/auth.utils')
const prisma = require('../config/prismaConfig')
const getUsers = async (parent, args, context, info) => {
    // const userPayload = verifyToken(context.req)
    // console.log(userPayload)
    if(context.user) {
        let users = await prisma.user.findMany({
            where: {
                NOT: {
                    username: context.user.username
                }
            }
        })

        const allUserMessages = await prisma.message.findMany({
            where: {
                OR: [
                    {
                        from: context.user.username
                    }, 
                    {
                        to: context.user.username
                    }
                ]
            }, 
            orderBy: [
                {
                    createdAt: 'desc'
                }
            ]
        })

        users = users.map(otherUser => {
            const latestMessage = allUserMessages.find(
                (m) => m.from === otherUser.username || m.to === otherUser.username
            )
            otherUser.latestMessage = latestMessage
            return otherUser
        })

        return users
    } 
    throw new Error('Not authenticated')
}

const getMessages = async (parent, args, context, info) => {
    const {from} = args
    try {
        const user = context.user
        if(!user) {
            throw new AuthenticationError('Unauthenticated')
        }

        const otherUser = await prisma.user.findUnique({
            where: {
                username: from
            }
        })

        if(!otherUser) {
            throw new UserInputError('User not found')
        }

        const messages = await prisma.message.findMany({
            where: {
                from: {
                    in: [user.username, otherUser.username]
                },
                to: {
                    in: [user.username, otherUser.username]
                }
            },
            orderBy: [
                {
                    createdAt: 'desc'
                }
            ]
        })
        return messages

    } catch (err) {
        console.log(err)
        throw err
    }
}

module.exports = {
    getUsers,
    getMessages
}