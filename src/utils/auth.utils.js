const jwt = require('jsonwebtoken')

const verifyToken = (req) => {
    if(req) {
        const authHeader = req.headers.authorization
        if(authHeader) {
            const token = authHeader.replace('Bearer ', '')
            if(!token) {
                throw new Error('No token found')
            }
            
            const {userId, username} = jwt.verify(token, process.env.SECRET_KEY)
            return {userId, username}
        }
    }
    throw new Error('Not authenticated')
}

module.exports = {
    verifyToken
}