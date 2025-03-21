import {S3Client} from "@aws-sdk/client-s3"
import config from "../config/config"
const s3Client=new S3Client({
    region:config.BUCKET_REGION!,
    credentials:{
        accessKeyId:config.ACCESS_KEY!,
        secretAccessKey:config.SECRET_ACCESS_KEY!,
    }
})
export default s3Client