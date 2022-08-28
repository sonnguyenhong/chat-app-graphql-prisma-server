const jwt = require('jsonwebtoken')

const verifyToken = (bearerToken) => {
    let token = bearerToken.replace('Bearer ', '')
    if(!token) {
        throw new Error('No token found')
    }
    const {userId, username} = jwt.verify(token, process.env.SECRET_KEY)
    return {userId, username}
    // if(req) {
    //     const authHeader = req.headers.authorization
    //     if(authHeader) {
    //         token = authHeader.replace('Bearer ', '')
    //         if(!token) {
    //             throw new Error('No token found')
    //         }
            
    //         const {userId, username} = jwt.verify(token, process.env.SECRET_KEY)
    //         return {userId, username}
    //     }
    // } 
    // throw new Error('Not authenticated')
}

module.exports = {
    verifyToken
}