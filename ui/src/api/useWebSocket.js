import {useEffect} from "preact/hooks";
import {signal} from "@preact/signals";

const websocketEndpoint = "ws://localhost:8888/ws";

const ws = signal({
    connection: null,
    pending: false,
});
const wsMessage = signal(null);

export const useWebSocket = () => {

    useEffect(() => {
        if (ws.value.connection || ws.value.pending) {
            return;
        }

        console.log("Opening Websocket", ws.value);
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
            console.info("Websocket Opened", new Date(), event)
        };
        socket.onclose = (event) => {
            ws.value = {
                connection: null,
                pending: false,
            };
            console.info("Websocket Closed", new Date(), event)
        };
        socket.onerror = (error) => {
            console.error("WebSocket Error", error);
        }
        socket.onmessage = (event) => {
            // console.log("WebSocket message", event);;
            wsMessage.value = JSON.parse(event.data);
        };
    }, []);

    return {
        socket: ws.value.connection,
        pending: ws.value.pending,
        message: wsMessage.value,
        url: ws.value.connection?.url,
    };
};
