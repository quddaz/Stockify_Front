import React, { createContext, useEffect, useState, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export const WebSocketContext = createContext(null);

const WebSocketProvider = ({ children }) => {
    const [stockData, setStockData] = useState([]);
    const [client, setClient] = useState(null);
    const clientRef = useRef(null);

    const connectWebSocket = useCallback(() => {
        const token = localStorage.getItem('accessToken');
        if (!token) return;

        if (clientRef.current && clientRef.current.active) return;

        const stompClient = new Client({
            webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
            connectHeaders: { Authorization: `Bearer ${token}` },
            reconnectDelay: 5000,
        });

        stompClient.onConnect = () => {
            stompClient.subscribe('/topic/price-update', (message) => {
                if (!message.body) return;
                try {
                    const data = JSON.parse(message.body);
                    if (Array.isArray(data)) setStockData(data);
                    else if (data.results) setStockData(data.results);
                } catch (err) {
                    console.error('WebSocket Parse Error:', err);
                }
            });
            setClient(stompClient);
        };

        stompClient.onStompError = (frame) => {
            console.error('Broker Error:', frame.headers['message']);
        };

        stompClient.activate();
        clientRef.current = stompClient;
    }, []);

    const disconnectWebSocket = useCallback(() => {
        if (clientRef.current) {
            clientRef.current.deactivate();
            clientRef.current = null;
            setClient(null);
        }
    }, []);

    useEffect(() => {
        connectWebSocket();
        return () => disconnectWebSocket();
    }, [connectWebSocket, disconnectWebSocket]);

    return (
        <WebSocketContext.Provider value={{ stockData, client, connectWebSocket, disconnectWebSocket }}>
            {children}
        </WebSocketContext.Provider>
    );
};

export default WebSocketProvider;