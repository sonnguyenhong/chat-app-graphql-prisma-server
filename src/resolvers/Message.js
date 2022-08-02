const createdAt = (parent, args, context, info) => {
    return parent.createdAt.toISOString()
}

module.exports = {
    createdAt
}