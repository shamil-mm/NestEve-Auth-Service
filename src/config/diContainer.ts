import { container } from "tsyringe";

import redisClient from "./redis";
import AuthService from "../services/implementaions/authService";
import AuthRepository from "../repositories/implementations/authRepository";
import AuthRoutes from "../routes/implementations/authRoutes";
import AuthController from "../controller/implementaions/authController";
import AuthMiddleware from "../middlewares/authMiddleware";
import AdminController from "../controller/implementaions/adminController";
import AdminRoutes from "../routes/implementations/adminRoutes";
import AdminRepository from "../repositories/implementations/adminRepository";
import AdminService from "../services/implementaions/adminService";
// user
container.register("AuthRepository", { useClass: AuthRepository });
container.registerInstance("RedisClient", redisClient);
container.register("AuthService", { useClass: AuthService });
container.register("AuthRoutes", { useClass: AuthRoutes });
container.register("AuthController", { useClass: AuthController });
container.register("AuthMiddleware", { useClass: AuthMiddleware });

// admin
container.register("AdminRoutes", { useClass: AdminRoutes });
container.register("AdminController", { useClass: AdminController });
container.register("AdminService", { useClass: AdminService });
container.register("AdminRepository", { useClass: AdminRepository });

export default container;
