import "reflect-metadata";
import express, { Request, urlencoded } from "express";
import container from "./config/diContainer";
import cors from "cors";
import connetDB from "./config/database";
import cookieParser from "cookie-parser";
import AuthRoutes from "./routes/implementations/authRoutes";
import { errorHandlerMiddleware } from "./middlewares/errorHandler";
import AdminRoutes from "./routes/implementations/adminRoutes";
import kafkaWrapper from "./services/Kafka/kafkaWrapper";
import HealthCheck from "./routes/implementations/healthCheck";
const app = express();

app.set("trust proxy", true);



app.use((req, res, next) => {
  console.log("request recieved in auth service", req.path);
  next();
});

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json({ limit: "50mb" }));
app.use(urlencoded({ extended: true, limit: "50mb" }));




const authRoutes = container.resolve(AuthRoutes);
const adminRoutes = container.resolve(AdminRoutes);
const healthCheck=container.resolve(HealthCheck)


app.use("/", authRoutes.router);
app.use("/", adminRoutes.router);
app.use("/",healthCheck.router)
app.use(errorHandlerMiddleware);

(async()=>{
  try {
    await kafkaWrapper.connect()
    connetDB();
    
  } catch (error) {
    console.log('error found in IIFE in app.ts',error)
  }

})()


export default app;
