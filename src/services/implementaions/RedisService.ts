import redisClient from "../../config/redis";
import { IRedisService } from "../interfaces/IRedisService";

class RedisService implements IRedisService{
    async setData(key: string, value: any, expirationInSeconds?: number): Promise<void> {
        try {
            const data=typeof value==="string"?value:JSON.stringify(value)
            expirationInSeconds?await redisClient.setex(key,expirationInSeconds,data):
            await redisClient.set(key,data)
        } catch (error:any) {
            console.error("❌ Redis SET Error:", error.message);
        }
    }
    async getData<T>(key: string): Promise<T | null> {
        try {
            const data= await redisClient.get(key)
            return data ? (JSON.parse(data) as T ):null 
        } catch (error) {
            console.error("❌ Redis GET Error:", error);
            return null 
        }
    }
    async deleteData(key: string): Promise<void> {
        try {
            const result =await redisClient.del(key)
            console.log(result > 0 ? `✅ Deleted: ${key}` : `⚠️ Key not found: ${key}`);
        } catch (error) {
            console.error("❌ Redis DELETE Error:", error);
        }
    }

    
}
export default new RedisService()