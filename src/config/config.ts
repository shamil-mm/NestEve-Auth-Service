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
    FRONTEND_URL:process.env.FRONTEND_URL,
    BUCKET_NAME:process.env.BUCKET_NAME,
    BUCKET_REGION:process.env.BUCKET_REGION,
    ACCESS_KEY:process.env.ACCESS_KEY,
    SECRET_ACCESS_KEY:process.env.SECRET_ACCESS_KEY
}