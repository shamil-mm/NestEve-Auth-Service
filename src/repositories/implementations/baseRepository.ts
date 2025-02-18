export class BaseRepository<T>{
    private model:any;

    constructor(model:any){
      this.model = model
    }

     async findById(id: string): Promise<T | null> {
        return await this.model.findById(id);
      }
    
      async findAll(): Promise<T[]> {
        return await this.model.find();
      }
    
      async create(item: T): Promise<T> {
        const newItem = new this.model(item);
        return await newItem.save();
      }
    
      async update(id: string, item: T): Promise<T | null> {
        return await this.model.findByIdAndUpdate(id, item, { new: true });
      }
    
      async delete(id: string): Promise<void> {
        await this.model.findByIdAndDelete(id);
      }
}