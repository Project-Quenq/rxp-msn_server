import WebSocket, { WebSocketServer } from "ws";
import { WSEvents } from "../interfaces/WebSocket.js";
import { UserData } from "../interfaces/User.js";

type EventCallback = (...args: any[]) => void;

export class WSManager {
    public __ws: WebSocketServer;
    private events: Map<string, EventCallback[]>;

    public clientIds: Map<WebSocket, string>;
    public clientsUsers: Map<WebSocket, UserData>;

    constructor(port: number, userId: string, host?: string) {
        this.events = new Map();
        this.clientIds = new Map();
        this.clientsUsers = new Map();

        this.__ws = new WebSocketServer({ port, host: host || "127.0.0.1" });

        this.__ws.on("connection", (socket: WebSocket, req) => {
            const ip = req.socket.remoteAddress || "unknown";
            const id = userId.replace('{timestamp}', Date.now().toString()).replace('{random}', Math.random().toString(36).slice(2, 8));
            this.clientIds.set(socket, id);

            socket.on("message", (data) => this.emit(WSEvents.Message, socket, data.toString()));

            socket.on("close", () => {
                this.emit(WSEvents.DelSocket, socket, ip, id);
                this.clientIds.delete(socket);
            });

            this.emit(WSEvents.NewSocket, socket, ip, id);
        });

        console.log(`WebSocket server started: ws://127.0.0.1:${port}`);
    }

    public on(eventName: WSEvents, cb: EventCallback) {
        eventName as string;
        if (!this.events.has(eventName)) this.events.set(eventName, []);
        this.events.get(eventName)!.push(cb);
    }

    private emit(eventName: WSEvents, ...args: any[]) {
        if (this.events.has(eventName)) {
            this.events.get(eventName)!.forEach((cb) => cb(...args));
        }
    }

    public getClients(): WebSocket[] {
        //@ts-ignore
        return Array.from(this.__ws.clients);
    }

    public getClientId(socket: WebSocket): string | undefined {
        return this.clientIds.get(socket);
    }

    public findClientById(id: string): WebSocket | undefined {
        for (const [socket, sid] of this.clientIds.entries()) {
            if (sid === id) return socket;
        }
        return undefined;
    }

    public send(socket: WebSocket, message: any) {
        if (socket.readyState !== WebSocket.OPEN) return;
        socket.send(message);
    }

    public broadcast(message: any) {
        this.getClients().forEach((client) => {
            if (client.readyState !== WebSocket.OPEN) return;
            client.send(message);
        });
    }

    public broadcastExcept(except: WebSocket | WebSocket[], message: any) {
        const msg = message;

        const excluded = Array.isArray(except) ? except : [except];
        this.getClients().forEach((client) => {
            if (client.readyState === WebSocket.OPEN && !excluded.includes(client)) client.send(msg);
        });
    }
    public broadcastTo(to: WebSocket | WebSocket[], message: any) {
        const msg = message;

        const included = Array.isArray(to) ? to : [to];
        this.getClients().forEach((client) => {
            if (client.readyState === WebSocket.OPEN && included.includes(client)) client.send(msg);
        });
    }

    public sendNop() {
        this.broadcast("nop-");
    }

    public connectedClients(): number {
        return this.getClients().length;
    }

    public isAlive(socket: WebSocket): boolean {
        return socket.readyState === WebSocket.OPEN;
    }
}
