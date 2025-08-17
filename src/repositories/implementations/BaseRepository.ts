import { Model,Document } from "mongoose";
import { IBaseRepository } from "../interfaces/IBaseRespository";
export class BaseRepository<T extends Document> implements IBaseRepository<T>{
    protected model :Model<T>
    constructor(model:Model<T>){
        this.model=model
    }
    async create(item: Partial<T>): Promise<Partial<T>> {
        const createItem=new this.model(item);
        return await createItem.save();
    }
    async findById(id: string): Promise<T | null> {
        return await this.model.findById(id).exec()
    }
    async findAll(filter?: Partial<T> | undefined): Promise<T[]> {
        return await this.model.find(filter as any).exec()
    }
    async update(id: string, item: Partial<T>): Promise<T | null> {
        return await this.model.findByIdAndUpdate(id,item,{new:true}).exec()
    }
    async delete(id:string):Promise<T|null>{
        return await this.model.findByIdAndDelete(id).exec()
    }
    async findOne(filter:Partial<T>):Promise<T|null>{
        return await this.model.findOne(filter as any).exec()
    }
}