import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [preact()],
	resolve: {
		dedupe: ["preact"],
		alias: {
			"react": "preact/compat",
			"react-dom": "preact/compat",
			"react-dom/test-utils": "preact/test-utils",
			"react/jsx-runtime": "preact/jsx-runtime",
			"@preact/signals-react": "@preact/signals",
		},
	},
	build: {
		minify: false
	},
	server: {
		proxy: {
			"/api": {
				target: "http://localhost:8888/api",
				changeOrigin: true,
			},
			"/ws": {
				target: "ws://localhost:8888",
				ws: true,
				rewriteWsOrigin: true,
			}
		}
	}
});
