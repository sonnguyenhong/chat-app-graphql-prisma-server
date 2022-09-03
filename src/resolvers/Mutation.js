const bcrypt = require('bcryptjs')
const {UserInputError, AuthenticationError, ForbiddenError} = require('apollo-server')
const jwt = require('jsonwebtoken')
const { verifyToken } = require('../utils/auth.utils')
const pubsub = require('../config/pubSubConfig')
const prisma = require('../config/prismaConfig')
const register = async (parent, args, context, info) => {
    const {username, email, password, confirmPassword} = args
    let errors = {}
    

    try {
        // Validate input data
        if(email.trim() === '')
            errors.email = 'Email must not be empty'
        if(username.trim() === '')
            errors.username = 'Username must not be empty'
        if(password.trim() === '')
            errors.password = 'Password must not be empty'
        if(confirmPassword.trim() === '')
            errors.confirmPassword = 'Repeat password must not be empty'
        if(password !== confirmPassword) {
            errors.confirmPassword = 'Password and repeat password must be the same'
        }
        // Check if username / email exists
        const usernameExist = await prisma.user.findUnique({
            where: {
                username: username
            }
        })
        
        const emailExist = await prisma.user.findUnique({
            where: {
                email: email
            }
        })

        if(usernameExist) {
            errors.username = 'Username has already been registed'
        }

        if(emailExist) {
            errors.email = 'Email has already been registed'
        }

        // console.log(errors)

        if(Object.keys(errors).length > 0) {
            console.log('has error')
            throw errors
        }

        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 6)
        // Create user
        const user = await prisma.user.create({
            data: {
                username, 
                email,
                password: hashedPassword,
            }
        })
        // Return user
        // console.log(user)
        return user
    } catch(err) {
        throw new UserInputError('Invalid input', {errors: err})
    }
}

const login = async(parent, args, context, info) => {
    const {username, password} = args
    let errors = {}
    
    try {
        if(username.trim() === '') 
            errors.username = 'Username must not be empty'
        if(password.trim() === '')
            errors.password = 'Password must not be empty'
        
        if(Object.keys(errors).length > 0) {
            throw new UserInputError('Invalid input', {errors})
        }
        // console.log('prisma: ', prisma)
        const userExist = await prisma.user.findUnique({
            where: {
                username: username
            }
        })

        if(!userExist) {
            errors.username = 'User not found'
            throw new UserInputError('User not found', {errors})
        }

        const correctPassword = await bcrypt.compare(password, userExist.password)
        if(!correctPassword) {
            errors.password = 'Password is incorrect'
            throw new UserInputError('Password is incorrect', {errors})
        }

        const token = jwt.sign({
            userId: userExist.id,
            username: userExist.username
        }, process.env.SECRET_KEY, {
            expiresIn: parseInt(process.env.EXPIRE_TIME)
        })

        userExist.token = token

        return userExist
    } catch(err) {
        console.log(err)
        throw err
    }
}

const sendMessage = async (parent, args, context, info) => {
    try {

        const {to, content} = args
        
        if(!context.user) {
            throw new AuthenticationError('Unauthenticated')
        }
        
        if(context.user.username === to) {
            throw new UserInputError('You cant message yourself')
        }

        const recipient = await prisma.user.findUnique({
            where: {
                username: to
            }
        })

        if(!recipient) 
            throw new UserInputError('User not found')

        if(content.trim() === '') {
            throw new UserInputError('Message is empty')
        }

        const message = await prisma.message.create({
            data: {
                from: context.user.username,
                to: to,
                content: content
            }
        })

        pubsub.publish('NEW_MESSAGE', {
            newMessage: message
        })
        
        return message

    } catch(err) {
        console.log(err)
        throw err
    }
}

const reactToMessage = async (_, args, context) => {
    const reactions = ['❤️', '😆', '😯', '😢', '😡', '👍', '👎']
    try {
        const {messageId, content} = args
        // Validate reactions
        if(!reactions.includes(content)) {
            throw new UserInputError('Invalid Reaction')
        }

        // Get user
        const username = context.user ? context.user.username: ''
        const user = await prisma.user.findUnique({
            where: {
                username: username
            }
        })

        if(!user) {
            throw new AuthenticationError('Unauthenticated')
        }

        // Get message
        const message = await prisma.message.findUnique({
            where: {
                id: messageId
            }
        })

        if(!message) {
            throw new UserInputError('Message not found')
        }

        if(message.from !== user.username && message.to !== user.username) {
            throw new ForbiddenError('Unauthorized')
        }

        // Create reaction
        let reaction = await prisma.reaction.findMany({
            where: {
                messageId: message.id, 
                userId: user.id
            }
        })
        
        reaction = reaction[0] ? reaction[0] : null
        
        if(reaction) {
            // If reaction exist, update it
            reaction = await prisma.reaction.update({
                where: {
                    id: reaction.id
                }, 
                data: {
                    content: content,
                    updatedAt: new Date()
                }
            })
        } else {
            // Reaction doesnt exists, create it
            reaction = await prisma.reaction.create({
                data: {
                    content: content,
                    messageId: message.id,
                    userId: user.id
                }
            })
        }   
        // reaction.message = message
        // reaction.user = user

        pubsub.publish('NEW_REACTION', {
            newReaction: reaction
        })

        return reaction

    } catch(e) {
        console.log(e)
        return e
    }
}

module.exports = {
    register,
    login,
    sendMessage,
    reactToMessage
}