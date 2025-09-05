export enum UserStatus {
    offline = -1,
    online = 1,
    busy = 0,
    away = 9,
    eating = 4,
    minute = 15,
    phone = 7
}

export interface UserData {
    id: string;
    displayname: string;
    avatar: string | Buffer;
    description: string | undefined|null; // "i love ketchup" - befaci
    status: UserStatus | null; // null is online
}
