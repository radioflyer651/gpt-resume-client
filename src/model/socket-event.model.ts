
/** Message received from the sockets, and transmitted through the socket service. */
export type SocketEvent = { message: string, args: any[]; resultCallback?: (arg: any) => void; };