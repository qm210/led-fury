import {useEffect} from "preact/hooks";
import {signal} from "@preact/signals";

const websocketEndpoint = "ws://localhost:8888/ws";

const ws = signal({
    connection: null,
    pending: false,
});
const wsMessage = signal(null);

const wsLastMessageAt = signal(null);

const now = () => (new Date()).toLocaleTimeString();

const openWebsocket = () => {
    if (ws.value.connection || ws.value.pending) {
        return;
    }
    console.log("Opening Websocket to", websocketEndpoint);
    ws.value = {
        connection: null,
        pending: true,
    };
    const socket = new WebSocket(websocketEndpoint);
    socket.onopen = (event) => {
        ws.value = {
            connection: socket,
            pending: false,
        };
        console.info("Websocket Opened at", now())
    };
    socket.onclose = (event) => {
        ws.value = {
            connection: null,
            pending: false,
        };
        console.info("Websocket Closed", now(), event)
        setTimeout(() => {
            openWebsocket();
        }, 2000);
    };
    socket.onerror = (error) => {
        console.error("WebSocket Error", error);
    }
    socket.onmessage = (event) => {
        wsMessage.value = JSON.parse(event.data);
        wsLastMessageAt.value = Date.now();
    };
    return socket;
};

export const useWebSocket = () => {

    useEffect(() => {
        const socket = openWebsocket();
        return () => {
            socket.close();
        }
    }, []);

    return {
        socket: ws.value.connection,
        pending: ws.value.pending,
        message: wsMessage.value,
        lastMessateAt: wsLastMessageAt.value,
        url: ws.value.connection?.url,
    };
};
