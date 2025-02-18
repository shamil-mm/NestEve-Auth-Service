import dotenv from "dotenv"
dotenv.config()
export default {
    DB_URI :process.env.MONGO_URI,
    jwtSecret:process.env.JWT_SECRET!,
    saltRounds:10,
    PORT:3000,
    NODE_ENV:process.env.NODE_ENV
}