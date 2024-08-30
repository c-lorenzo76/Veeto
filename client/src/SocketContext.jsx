import React, { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const newSocket = io('http://localhost:8000', {
            autoConnect: false, // Do not connect immediately
        });

        newSocket.on('connect', () => setIsConnected(true));
        newSocket.on('disconnect', () => setIsConnected(false));

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, []);

    const connectSocket = (token) => {
        if (socket) {
            socket.auth = { token };
            socket.connect();
        }
    };

    return (
        <SocketContext.Provider value={{ socket, isConnected, connectSocket }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => {
    return useContext(SocketContext);
};
