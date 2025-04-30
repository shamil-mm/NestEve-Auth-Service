import { Topics } from "../topics/topic";
export interface UserCreateEvent{
    topic:Topics.userCreated
    data:{ 
        _id:string;
        name:string;
        email:string;
        avatarUrl?:string|null;
        role?: "user" | "admin" | "organizer";
        organizationName?: string | null;
        is_block: boolean;

    }
}
