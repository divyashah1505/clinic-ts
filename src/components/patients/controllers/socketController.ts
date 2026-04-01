import type { Server as SocketServer, Socket } from 'socket.io';
const { Server } = require('socket.io');

let io: SocketServer | undefined;

interface UserConnection {
    socketId: string;
    deviceType: string;
}

const onlineUsers = new Map<string, UserConnection[]>();

const initSocket = (server: any): void => {
    io = new Server(server, {
        cors: { origin: "*" } 
    });

    io?.on('connection', (socket: Socket) => {
        const userId = socket.handshake.query.userId;
        const deviceType = (socket.handshake.query.deviceType as string) || 'unknown';

        if (!userId) {
            console.log('No userId provided. Disconnecting socket:', socket.id);
            socket.disconnect(true);
            return;
        }

        const identifier = userId.toString();
        console.log(`User Connected: ${identifier} on ${deviceType}`);

        if (!onlineUsers.has(identifier)) {
            onlineUsers.set(identifier, []);
        }
        
        const connections = onlineUsers.get(identifier);
        if (connections) {
            connections.push({ socketId: socket.id, deviceType });
        }

        socket.on('disconnect', (reason: string) => {
            console.log(`User Disconnected: ${identifier}. Reason: ${reason}`);
            const userConnections = onlineUsers.get(identifier);
            if (userConnections) {
                const updatedConnections = userConnections.filter(conn => conn.socketId !== socket.id);
                if (updatedConnections.length === 0) {
                    onlineUsers.delete(identifier);
                } else {
                    onlineUsers.set(identifier, updatedConnections);
                }
            }
        });
    });
};

const sendNotificationToUser = (identifier: string | number, eventName: string, data: any): boolean => {
    const idStr = identifier.toString();
    const userConnections = onlineUsers.get(idStr);

    if (userConnections && io) {
        userConnections.forEach(connection => {
            io!.to(connection.socketId).emit(eventName, data);
            console.log(`[Socket] Event "${eventName}" sent to User ${idStr} (${connection.deviceType})`);
        });
        return true;
    } else {
        console.log(`[Socket] User ${idStr} is NOT online. Message not sent.`);
        return false;
    }
};

export default { initSocket, sendNotificationToUser };
