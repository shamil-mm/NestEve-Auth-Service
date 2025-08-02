import { Kafka,Producer,Consumer,Partitioners } from "kafkajs";
import dotevn from 'dotenv'
dotevn.config


class KafkaWrapper {
    private _kafka:Kafka
    private _producer?:Producer
    private _consumer?:Consumer
    constructor(){
        const brokers= (process.env.KAFKA_BROKER || "localhost:9092").split(",")
        this._kafka=new Kafka({
            clientId:'auth-service',
            brokers
        })
    }
    async connect():Promise<void>{
        try {
            this._producer=this._kafka.producer({createPartitioner:Partitioners.DefaultPartitioner})
            await this._producer.connect()
            console.log('kafka Producer connected')
        } catch (error) {
            console.log('kafka connection error' ,error)
        }
    }
    get producer(){
        if(!this._producer) throw new Error('producer not initialized')
            return this._producer
    }
    get consumer(){
        if(!this._consumer) throw new Error('consumer not initialized')
            return this._consumer
    }
    async createConsumer(groupId:string):Promise<Consumer>{
        this._consumer=this._kafka.consumer({groupId,retry:{retries:5}});
        await this._consumer.connect()
        console.log(`Kafka Consumer Connected (Group: ${groupId})`)
        return this. consumer
    }
    async disconnect(){
        try {
            await this._producer?.disconnect()
            console.log('kafka disconnected')
        } catch (error) {
            console.log("Error disconnecting Kafka:", error)
        }
    }

}

const kafkaWrapper=new KafkaWrapper()
export default kafkaWrapper