export interface Is3Service{
    uploadImageToBucket(bufferCode:Buffer,type:string,key:string):any
    getImageFromBucket(key:string):any;
    deleteImageFromBucket(key:string):any
}