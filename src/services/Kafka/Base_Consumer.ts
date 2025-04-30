import { Consumer } from "kafkajs";
import { Topics } from "./topics/topic";

interface Event{
    topic:Topics;
    data:any
}

export declare abstract class KafkaConsumer <T extends Event>{
    abstract topic:T['topic']
    abstract groupId:string
    protected consumer:Consumer;
    constructor(consumer:Consumer);
    listen():Promise<void>
    abstract onMessage(data:T['data']):Promise<void>
}
export {}