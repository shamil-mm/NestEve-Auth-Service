import {Router} from "express"
import { inject,injectable } from "tsyringe";
import { IAuthController } from "../../controller/interfaces/IAuthController";
import { IAuthRoutes } from "../interfaces/IAuthRoutes";
import AuthMiddleware from "../../middlewares/authMiddleware";



@injectable()
class AuthRoutes implements IAuthRoutes{

    public path = '/api';
    public router = Router();

    constructor (
        @inject('AuthController') private authController:IAuthController ,
        @inject('AuthMiddleware') private authMiddleware:AuthMiddleware ,
    ){
        this.initializeRoutes();
    }

    private initializeRoutes(){
        
        this.router.post(`${this.path}/register`,this.authController.register.bind(this.authController))
        this.router.post(`${this.path}/login`,this.authController.login.bind(this.authController))
        this.router.post(`${this.path}/admin/login`,this.authController.adminLogin.bind(this.authController))
        this.router.post(`${this.path}/logout`,this.authMiddleware.handle.bind(this.authMiddleware),this.authController.logout.bind(this.authController))
        this.router.post(`${this.path}/refresh-token`,this.authController.refreshToken.bind(this.authController))
    }

}


export default AuthRoutes