
export type UserMessageLevels = 'success' | 'info' | 'warn' | 'error';

export interface UserMessage {
    level: UserMessageLevels;
    content: string;
    title?: string;
}