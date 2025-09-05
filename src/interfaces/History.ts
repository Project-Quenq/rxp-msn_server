export interface ChatHistoryFile {
    content: {
        userId: string;
        type: "text"|"wink";
        data: string;
    }[];
}