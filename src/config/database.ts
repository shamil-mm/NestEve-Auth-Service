import mongoose from "mongoose";
import dotenv from "dotenv"

dotenv.config();

const connetDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI!);
        console.log("mongodb connected")
    } catch (error) {
        console.log("mogodb connection failed", error)
        process.exit(1)
    }
}

export default connetDB