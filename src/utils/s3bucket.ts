import {DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client} from "@aws-sdk/client-s3"
import config from "../config/config"
import { Is3Service } from "./interfaces/Is3Service"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { injectable } from "tsyringe";


@injectable()
class S3Service implements Is3Service{
    private s3:S3Client;
    private bucketName:string

    constructor(){
        this.bucketName=config.BUCKET_NAME as string
        const bucketRegion:string=config.BUCKET_REGION as string
        const accessKey:string=config.BUCKET_ACCESS_KEY as string
        const secretAccessKey:string=config.BUCKET_SECRET_ACCESS_KEY as string
        this.s3=new S3Client({
            credentials:{
                accessKeyId:accessKey,
                secretAccessKey:secretAccessKey
            },
            region:bucketRegion
        })
    }
    async uploadImageToBucket(bufferCode: Buffer, type: string, key: string) {
        try {
            const params={
                Bucket:this.bucketName,
                Key:key,
                Body:bufferCode,
                ContentType:type
            }
            const command= new PutObjectCommand(params)
            const data= await this.s3.send(command)
            return data
        } catch (error) {
           console.log('error form s3 service upload image to bucket',error) 
           return error
        }
    }
    async getImageFromBucket(key: string) {
        try {
            const imageUrl= await getSignedUrl(
                this.s3,
                new GetObjectCommand({
                    Bucket:this.bucketName,
                    Key:key
                }),
                {expiresIn:60}
            )

            return imageUrl
        } catch (error) {
            console.log("error in get image form the bucket ",error) 
            return error
        }
    }
    async deleteImageFromBucket(key: string) {
        try {
            const deleteParams={
                Bucket:this.bucketName,
                Key:key
            }
            const data= await this.s3.send(new DeleteObjectCommand(deleteParams))
            return data;
        } catch (error) {
            console.log("error in delete image form the bucket ",error) 
            return error
            
        }
    }

}
export default S3Service
