import {container} from "tsyringe"
import redisClient from "./redis"
import AuthService from "../services/implementaions/authService"
import AuthRepository from "../repositories/implementations/authRepository"
import AuthRoutes from "../routes/implementations/authRoutes"
import AuthController from "../controller/implementaions/authController"
import AuthMiddleware from "../middlewares/authMiddleware"


container.register("AuthRepository",{useClass:AuthRepository})
container.registerInstance("RedisClient",redisClient)
container.register("AuthService",{useClass:AuthService})
container.register("AuthRoutes",{useClass:AuthRoutes})
container.register("AuthController",{useClass:AuthController})
container.register("AuthMiddleware",{useClass:AuthMiddleware})

export default container
