import Redis from "ioredis";


const redisClient= new Redis({
    host:process.env.REDIS_HOST,
    port:Number(process.env.REDIS_PORT)
})

redisClient.on("connect",()=>console.log("connected to redis"))
redisClient.on("error",(err)=>console.log("redis failed to connect: ",err))

export default redisClient