import { Producer } from "kafkajs";
import { Topics } from "./topics/topic";
interface Events {
    topic:Topics
    data:any
}

export abstract class KafkaPublisher <T extends Events>{
    abstract topic:T['topic']
    protected producer:Producer
    constructor(producer:Producer){
        this.producer=producer
    }

    async produce(data:T['data']):Promise<void>{
        try {
           const result= await this.producer.send({
                topic:this.topic,
                messages:[{value:JSON.stringify(data)}]
            })
            console.log(`Successfully published to ${this.topic}`, {
                topic: result[0].topicName,
                partition: result[0].partition,
                offset: result[0].offset
            });     
        } catch (error) {
            console.error(`Error publishing to ${this.topic}:`, error);
            throw error;
        }
    }
}
export {}
