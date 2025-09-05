export interface IConfig {
    server: [string, number];
    maxHistoryLength: number;
    keepAliveEverySeconds: number;
    userId: string;
}