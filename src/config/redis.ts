import Redis from "ioredis";

const redisClient= new Redis({
    host:"127.0.0.1",
    port:6379
})

redisClient.on("connect",()=>console.log("connected to redis"))
redisClient.on("error",(err)=>console.log("redis failed to connect: ",err))

export default redisClient