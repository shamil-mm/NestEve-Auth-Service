import dotenv from "dotenv"
dotenv.config()
export default {
    DB_URI :process.env.MONGO_URI,
    jwtSecret:process.env.JWT_SECRET!,
    saltRounds:10,
    PORT:3000,
    NODE_ENV:process.env.NODE_ENV,
    EMAIL_USER:process.env.EMAIL_USER,
    EMAIL_PASSWORD:process.env.EMAIL_PASSWORD,
    EMAIL_SECRET:process.env.EMAIL_SECRET,
    FRONTEND_URL:process.env.FRONTEND_URL
}