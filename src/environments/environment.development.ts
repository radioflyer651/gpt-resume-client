import { AppConfig } from "../model/app-config.models";

export const environment: AppConfig = {
    apiBaseUrl: 'http://localhost:1062/',
    chatSocketIoEndpoint: 'ws://localhost:1062/',
    chatSocketPath: '/chat-io/',
};
