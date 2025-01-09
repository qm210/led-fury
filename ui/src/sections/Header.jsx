import { useLocation } from 'preact-iso';
import {useWebSocket} from "../api/useWebSocket.js";
import {SquarePower} from "lucide-preact";
import {useOverallMutations} from "../api/apiHooks.js";

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
		} : {
			color: "#FAA",
			text: "Socket disconnected!"
		};

	return (
		<div
			title={ws.url}
			onClick={() => console.log(ws)}
		>
			{
				ws.pending
					? "..."
					: (
						<span style={{color: props.color}}>
							{props.text}
						</span>
					)
			}
		</div>
	);
};

const ShutdownButton = () => {
	const {shutdown} = useOverallMutations();
	return (
		<button class="p-3"
			onClick = {() => shutdown()}
			title = "Shuts down the backend, i.e. also the frontend dies."
		>
			<SquarePower color="#FF8888"/>
		</button>
	)
};
