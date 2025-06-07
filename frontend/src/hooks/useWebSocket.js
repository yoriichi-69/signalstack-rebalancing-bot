import { useState, useEffect, useRef, useCallback } from 'react';

const useWebSocket = (url, options = {}) => {
  const [socket, setSocket] = useState(null);
  const [lastMessage, setLastMessage] = useState(null);
  const [readyState, setReadyState] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState('Connecting');
  const messageHistory = useRef([]);
  const reconnectTimeoutId = useRef();
  const reconnectCount = useRef(0);

  const {
    onOpen,
    onClose,
    onMessage,
    onError,
    shouldReconnect = true,
    reconnectAttempts = 5,
    reconnectInterval = 3000,
    protocols = []
  } = options;

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(url, protocols);
      
      ws.onopen = (event) => {
        setReadyState(WebSocket.OPEN);
        setConnectionStatus('Connected');
        reconnectCount.current = 0;
        if (onOpen) onOpen(event);
      };

      ws.onclose = (event) => {
        setReadyState(WebSocket.CLOSED);
        setConnectionStatus('Disconnected');
        if (onClose) onClose(event);
        
        if (shouldReconnect && reconnectCount.current < reconnectAttempts) {
          reconnectCount.current++;
          setConnectionStatus(`Reconnecting... (${reconnectCount.current}/${reconnectAttempts})`);
          reconnectTimeoutId.current = setTimeout(connect, reconnectInterval);
        }
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        setLastMessage(message);
        messageHistory.current.push(message);
        if (messageHistory.current.length > 100) {
          messageHistory.current.shift();
        }
        if (onMessage) onMessage(message);
      };

      ws.onerror = (event) => {
        setConnectionStatus('Error');
        if (onError) onError(event);
      };

      setSocket(ws);
    } catch (error) {
      console.error('WebSocket connection error:', error);
    }
  }, [url, protocols, onOpen, onClose, onMessage, onError, shouldReconnect, reconnectAttempts, reconnectInterval]);

  const sendMessage = useCallback((message) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, [socket]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutId.current) {
      clearTimeout(reconnectTimeoutId.current);
    }
    if (socket) {
      socket.close();
    }
  }, [socket]);

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    socket,
    lastMessage,
    readyState,
    connectionStatus,
    messageHistory: messageHistory.current,
    sendMessage,
    disconnect,
    reconnect: connect
  };
};

export default useWebSocket;