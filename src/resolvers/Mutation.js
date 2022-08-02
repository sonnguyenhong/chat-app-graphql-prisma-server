const bcrypt = require('bcryptjs')
const {UserInputError, AuthenticationError} = require('apollo-server')
const jwt = require('jsonwebtoken')
const { verifyToken } = require('../utils/auth.utils')

const pubsub = require('../config/pubSubConfig')

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
        const usernameExist = await context.prisma.user.findUnique({
            where: {
                username: username
            }
        })
        
        const emailExist = await context.prisma.user.findUnique({
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
        const user = await context.prisma.user.create({
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

        const userExist = await context.prisma.user.findUnique({
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
        let user = verifyToken(context.req)
        if(!user) {
            throw new AuthenticationError('Unauthenticated')
        }
        
        if(user.username === to) {
            throw new UserInputError('You cant message yourself')
        }

        const recipient = await context.prisma.user.findUnique({
            where: {
                username: to
            }
        })

        if(!recipient) 
            throw new UserInputError('User not found')

        if(content.trim() === '') {
            throw new UserInputError('Message is empty')
        }

        const message = await context.prisma.message.create({
            data: {
                from: user.username,
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

module.exports = {
    register,
    login,
    sendMessage
}