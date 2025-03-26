import { AppConfig } from "../model/app-config.models";

export const environment: AppConfig = {
    production: true,
    apiBaseUrl: 'https://www.richardolson.org/api/',
    chatSocketIoEndpoint: 'ws://richardolson.org/chat-io'
};
