import "reflect-metadata";
import express, { urlencoded } from "express";
import container from "./config/diContainer";
import cors from "cors";
import connetDB from "./config/database";
import cookieParser from "cookie-parser";
import AuthRoutes from "./routes/implementations/authRoutes";
import { errorHandlerMiddleware } from "./middlewares/errorHandler";
import AdminRoutes from "./routes/implementations/adminRoutes";
const app = express();
app.set("trust proxy", true);
app.use(express.json());
app.use(urlencoded({ extended: true }));

app.use(cookieParser());

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

const authRoutes = container.resolve(AuthRoutes);
const adminRoutes = container.resolve(AdminRoutes);
app.use((req, res, next) => {
  console.log("request recieved in auth service", req.path);
  next();
});

app.use("/", authRoutes.router);
app.use("/", adminRoutes.router);
app.use(errorHandlerMiddleware);
connetDB();

export default app;
