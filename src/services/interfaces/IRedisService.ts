export interface IRedisService{
    setData(key:string,value:any,expirationInSecond?:number):Promise<void>
    getData<T>(key:string):Promise<T|null>
    deleteData(key:string):Promise<void>
}