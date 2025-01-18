import { render } from 'preact';
import {LocationProvider, Router, Route} from 'preact-iso';
import {QueryClient, QueryClientProvider} from "@preact-signals/query";

import EditorPage from './sections/MainEditor.jsx';
import { NotFound } from './sections/_404.jsx';

import {Header} from "./sections/Header.jsx";
import Loader from "./utils/Loader.jsx";
import {Suspense} from "react";

import './styles/index.css';
import './styles/components.css';
import './styles/dist.css'; // tailwind build, generate via "npm run tailwind:build"
import 'rc-slider/assets/index.css';


const queryClient = new QueryClient();

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
			<Suspense fallback={<Loader/>}>
				<Router>
					<Route
						path={"/"}
						component={EditorPage}
					/>
					<Route
						default
						component={NotFound}
					/>
				</Router>
			</Suspense>
		</main>
	</>;

render(
	<App/>,
	document.getElementById('app')
);
