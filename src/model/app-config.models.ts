
export interface AppConfig {
    production?: boolean;
    apiBaseUrl: string;
    chatSocketIoEndpoint: string;
    // The path property for the socket.io configuration.
    //  This is different than the namespace.
    chatSocketPath: string;
}