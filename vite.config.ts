import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const file = fileURLToPath(new URL('package.json', import.meta.url));
const json = readFileSync(file, 'utf8');
const pkg = JSON.parse(json);

export default defineConfig({
	plugins: [
		react(),
		VitePWA({
			registerType: 'autoUpdate',
			manifest: {
				name: 'Unilux Thermostat V2',
				short_name: 'Thermostat',
				description: 'Smart MQTT-based thermostat control',
				theme_color: '#1e293b',
				background_color: '#0f172a',
				start_url: '/',
				display: 'standalone',
				scope: '/',
				icons: [
					{
						src: '/favicon.svg',
						sizes: 'any',
						type: 'image/svg+xml',
						purpose: 'any'
					},
					{
						src: '/pwa-192x192.png',
						sizes: '192x192',
						type: 'image/png'
					},
					{
						src: '/pwa-512x512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'any'
					},
					{
						src: '/pwa-512x512-maskable.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'maskable'
					}
				]
			},
			workbox: {
				globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
				runtimeCaching: [
					{
						urlPattern: /^https:\/\/.*\.js$|^https:\/\/.*\.css$/,
						handler: 'CacheFirst',
						options: {
							cacheName: 'assets-cache',
							expiration: {
								maxEntries: 50,
								maxAgeSeconds: 7 * 24 * 60 * 60
							}
						}
					},
					{
						urlPattern: /^ws:\/\/.*mqapi\.uniluxthermostat\.com.*/,
						handler: 'NetworkFirst',
						options: {
							cacheName: 'mqtt-cache'
						}
					}
				]
			}
		})
	],
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src')
		}
	},
	define: {
		'import.meta.env.APP_VERSION': JSON.stringify(pkg.version)
	}
});
