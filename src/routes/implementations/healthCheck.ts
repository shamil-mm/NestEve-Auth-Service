import { Request, Response, Router } from "express";
import mongoose from "mongoose";
import { StatusCodes } from "../../constants/statusCode";


class HealthCheck{
    public router=Router()
    constructor(){
        this.router.get('/health',this._healthCheck.bind(this))
    }
    private async _healthCheck(req:Request,res:Response){
        const uptime=process.uptime()
        let dbStatus='UNKNOWN';
        let dbTime='UNKNOWN';
        try {
            const dbConnectionStatus=mongoose.connection.readyState
            if(dbConnectionStatus===1){
                dbStatus="CONNECTED"
                dbTime=new Date().toISOString()
            }else{
                dbStatus="DISCONNECTED"
            }
        } catch (error:any) {
            dbStatus="ERROR"
            dbTime=error.message
        }

        res.status(StatusCodes.OK).json({
            status:'UP',
            uptime:`${Math.round(uptime)} seconds`,
            database:{
                status:dbStatus,
                lastChecked:dbTime
            },
            time:new Date().toISOString()
        })
    }
}
export default HealthCheck