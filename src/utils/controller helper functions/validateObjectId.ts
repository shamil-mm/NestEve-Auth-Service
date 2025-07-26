import { Types } from "mongoose";
import { AppError } from "../../error/AppError";
import { StatusCodes } from "../../constants/statusCode";
import { Messages } from "../../constants/messages";

export const validateObjectId=(id:string)=>{
    if(!Types.ObjectId.isValid(id)){
        throw new AppError(Messages.INVALID_ID,StatusCodes.BAD_REQUEST)
    }
}