import { useState, useEffect } from 'react';
import socketIOClient from 'socket.io-client';

export function useSocket({ endpoint, token }) {
    const socket = socketIOClient(endpoint, {
        auth: {
            token: token
        }
    });
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        console.log('useSocket useEffect', endpoint, socket)

        function onConnect() {
            setIsConnected(true)
        }

        function onDisconnect() {
            setIsConnected(false)
        }

        socket.on('connect', onConnect)
        socket.on('disconnect', onDisconnect)

        return () => {
            socket.off('connect', onConnect)
            socket.off('disconnect', onDisconnect)
        }
    }, [token]);

    return {
        isConnected,
        socket,
    };
}