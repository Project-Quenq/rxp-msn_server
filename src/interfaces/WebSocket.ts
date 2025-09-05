export enum WSEvents {
    NewSocket = "connection",
    DelSocket = "close",
    Message = "message"
}
export enum WSMessages {
    NewMessage = "sndmsg",
    Kick = "kIck.close|"
}
