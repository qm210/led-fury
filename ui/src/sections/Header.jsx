import { useLocation } from 'preact-iso';
import {useWebSocket} from "../api/useWebSocket.js";
import {SquarePower} from "lucide-preact";
import {shutdownBackend} from "../api/api.js";
import {currentRgbArray, lastRgbUpdateInfo} from "../signals/sequence.js";

export function Header() {
	const { url } = useLocation();
	return (
		<header>
			<nav>
				{/*<a href="/" class={url == '/' && 'active'}>*/}
				{/*	Home*/}
				{/*</a>*/}
			</nav>
			<WebsocketInfo/>
			<ShutdownButton/>
		</header>
	);
}

const WebsocketInfo = () => {
	const ws = useWebSocket();
	const props = ws.socket
		? {
			color: "#BD9",
			text: "Socket connected."
		}
		: ws.pending ? {
			color: "#AAA",
			text: "Connecting..."
		} : {
			color: "#FAA",
			text: "Socket disconnected!"
		};

	const lastReceivedInfo =
		lastRgbUpdateInfo.value.receivedAt
			? `Last Update at ${lastRgbUpdateInfo.value.receivedAt.toLocaleTimeString()}`
			: '';

	return (
		<div
			title={ws.url}
			onClick={() => console.log(ws, currentRgbArray.value)}
			style={{color: props.color}}
		>
			{
				lastReceivedInfo &&
				<span className={"opacity-40"}>
					{lastReceivedInfo}{" \u2014 "}
				</span>
			}
			<span>
				{props.text}
			</span>
		</div>
	);
};

const ShutdownButton = () =>
	<button
		onClick = {shutdownBackend}
		title = "Shuts down the whole aplication. No more fun."
	>
		<SquarePower color="#FF8888"/>
	</button>;
