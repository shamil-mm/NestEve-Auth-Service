import { Producer } from "kafkajs";
import { KafkaPublisher } from "../Base_Producer";
import { UserCreateEvent } from "../events/user-created-event";
import { Topics } from "../topics/topic";

export class UserCreateProducer extends KafkaPublisher<UserCreateEvent>{
    topic:Topics.userCreated=Topics.userCreated
    constructor(producer:Producer){
        super(producer)
    }
}