import { render } from 'preact';
import {LocationProvider} from 'preact-iso';
import {QueryClient, QueryClientProvider} from "@preact-signals/query";
import {Header} from "./sections/Header.jsx";
import EditorPage from './sections/MainEditor.jsx';
import ErrorBoundary from "./sections/ErrorBoundary.jsx";

import './styles/dist.css'; // tailwind build, generate via "npm run tailwind:build"
import 'rc-slider/assets/index.css';
import './styles/index.css';
import './styles/components.css';
import QueryInitializer from "./sections/QueryInitializer.jsx";


export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			timeout: 5000
		}
	}
});


const App = () =>
	<LocationProvider>
		<QueryClientProvider client={queryClient}>
			<Layout/>
		</QueryClientProvider>
	</LocationProvider>;

const Layout = () =>
	<>
		<Header/>
		<main>
			<ErrorBoundary>
				<QueryInitializer>
					<EditorPage/>
				</QueryInitializer>
			</ErrorBoundary>
		</main>
	</>;

render(
	<App/>,
	document.getElementById('app')
);
