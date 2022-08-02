const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

async function main() {
    const hashedPassword = await bcrypt.hash("123", 6)
    const users = await prisma.user.createMany({
        data: [
            {username: "sonnh", password: hashedPassword, email: "sonnh@son.com"},
            {username: "sonnh1", password: hashedPassword, email: "sonnh1@son.com"},
            {username: "sonnh2", password: hashedPassword, email: "sonnh2@son.com"},
        ]
    })
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })