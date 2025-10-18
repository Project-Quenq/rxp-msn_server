import { WSManager } from "./managers/WSManager.js";
import WebSocket from "ws";
import { IConfig } from "./interfaces/IConfig.js";
import { UserStatus } from "./interfaces/User.js";
//@ts-ignore
import { WSProtocol } from "./Protocol.js";
import { WSEvents, WSMessages } from "./interfaces/WebSocket.js";

export class MSNServer {
    public __ws: WSManager;
    private connected: WebSocket[];

    public onlineUsers: string[]; // user id to store here
    public subToContact: Map<WebSocket, string>; // local socket and remote user id

    public lastNudge: Map<string, number>; // user id and timestamp

    constructor(config: IConfig) {
        // initialize the variables
        this.onlineUsers = [];
        this.connected = [];
        //@ts-ignore
        this.subToContact = new Map();
        //@ts-ignore
        this.lastNudge = {};

        this.__ws = new WSManager(config.server[1], config.userId);

        setInterval(() => {
            this.__ws.getClients().forEach((client) => client.readyState === WebSocket.OPEN ? client.ping() : this.kick(client));
        }, config.keepAliveEverySeconds * 1000);

        this.__ws.on(WSEvents.NewSocket, (client: WebSocket, ip: string, id: string) => {
            console.log(`New Connection: From the IP ${ip} with ID ${id}`);
            setTimeout(() => client.send(`è----|${id}-=°`), 500);
            setTimeout(() => {
                if (!this.connected.includes(client)) {
                    console.log(`Client didn't logged in, client ID is ${this.__ws.clientIds.get(client)}!`);
                    return this.kick(client, 'Not logged in (non_verified_connection_identity)');
                };
                //@ts-ignore
                if (!this.subToContact.get(client) || !this.connected.some((socket) => socket === this.subToContact.get(this.__ws.getClientId(client)))) return this.kick(client, 'No active chat');
                this.__ws.getClients().find((socket) => client === socket)?.send('%OK&');
                this.sendGlobalMessage(`${this.__ws.clientIds.get(client)} has signed in.`);
            }, 2300);
        });
        this.__ws.on(WSEvents.DelSocket, (client: WebSocket, ip: string, id: string) => {
            if (this.connected.find((socket) => socket === client)) this.connected = this.connected.filter(socket => socket !== client);
            console.log(`Client disconnected to the server: From the IP ${ip} with ID ${id}`);
        });
    }

    onMessage(socket: WebSocket, data: string): any {
        const message = WSProtocol.decodeData(data);
        
        // login handler thingy
        if (message.type === WSMessages.LoginMSN) {
            const name = message.args[0];
            const avatar = message.args[1];
            //@ts-ignore
            const status = message.args[2] as UserStatus;
            const desc = message.args[3];
            if (!message.args[0]) return this.kick(socket, 'invalid_login');
            // TODO: length logic
            if (!name?.match(/^[a-zA-Z0-9_.]+$/) || ((name.length !< 4 || name.length !> 16) && name !== "§")) return this.kick(socket, 'Invalid username (an username should only contain letters, numbers, a dot or an underscore and 4-16 characters)');

            this.connected.push(socket);
            this.__ws.clientsUsers.set(socket, {
                status: status || UserStatus.online,
                description: desc || undefined,
                //@ts-ignore
                displayname: name,
                //@ts-ignore
                id: this.__ws.getClientId(socket),
                //@ts-ignore
                avatar
            });
            socket.send('LOGGED$IN^ç');
        } else if (message.type === WSMessages.SubContact/*go to contact*/) {
            const target = message.args[0];
            const subscriber = this.__ws.getClientId(socket);
            
            //@ts-ignore
            this.subToContact.set(subscriber, target);
        } else if (message.type === WSMessages.NewMessage) {
            const [channel, msg] = message.args;
            //@ts-ignore
            const decoded = WSProtocol.decodeMessage([channel, msg]);

            if (!decoded.channel || !decoded.message || ((decoded.user?.length !< 4 && decoded.user?.length !> 16) && decoded.user !== "§")) return this.kick(socket, "not_valid_packet");

        }
    }

    kick(socket: WebSocket, reason?: string): boolean {
        socket.send(WSMessages.Kick + `You've been disconnected from MSN${reason ? `: ${reason}` : ""}`);
        socket.close();
        if (socket.readyState === socket.CLOSED) return true;
        else return false;
    }

    sendGlobalMessage(html: string): void {
        //@ts-ignore
        this.__ws.broadcast(WSProtocol.encode(WSMessages.NewMessage, WSProtocol.encodeData([WSProtocol.encodeMessage(`${btoa('global')}@§`, html)]))); // the username § means System
    }
}
