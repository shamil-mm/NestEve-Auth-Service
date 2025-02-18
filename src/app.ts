import "reflect-metadata"
import express, { urlencoded } from "express"
import container from "./config/diContainer"
import cors from 'cors'
import connetDB from "./config/database"
import cookieParser from 'cookie-parser'
import AuthRoutes from "./routes/implementations/authRoutes"


const app= express()

app.use(cors())
app.use(express.json())
app.use(cookieParser())
app.use(urlencoded({extended:true}))


const authRoutes=container.resolve(AuthRoutes)

app.use((req,res,next)=>{
    console.log(req.path)
    next()
})
app.use("/",authRoutes.router)

connetDB()

export default app;