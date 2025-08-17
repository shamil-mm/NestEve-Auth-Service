export interface IBaseRepository<T>{
    create(item:Partial<T>):Promise<Partial<T>>
    findById(id:string):Promise<T |null>
    findAll(filter?:Partial<T>):Promise<T[]>
    update(id:string,item:Partial<T>):Promise<T|null>
    delete(id:string):Promise<T|null>
    findOne(filter: Partial<T>):Promise<Partial<T>| null>
}