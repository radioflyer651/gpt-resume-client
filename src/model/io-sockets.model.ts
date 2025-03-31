
type io = typeof import('socket.io-client').io;

/** The type of the io member in the socket.io-client library. */
export type IoSocketType = ReturnType<io>;
/** The type of a message sent through socket.io. */
export type SocketMessage = { message: string, args: any[]; };