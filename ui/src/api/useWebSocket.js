import {useEffect} from "preact/hooks";
import {useSignal} from "@preact/signals";

const url = "ws://localhost:8888/ws";

export const useWebSocket = () => {
    const ws = useSignal({
        connection: null,
        pending: false,
    });
    const wsMessage = useSignal(null);

    useEffect(() => {
        if (ws.value.connection || ws.value.pending) {
            return;
        }

        const socket = new WebSocket(url);
        ws.value = {
            connection: null,
            pending: true,
        };
        socket.onopen = () => {
            ws.value = {
                connection: socket,
                pending: false,
            };
        };
        socket.onclose = () => {
            ws.value = {
                connection: null,
                pending: false,
            };
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
        url,
    };
};
