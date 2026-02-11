import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';
import { config } from './src/lib/server/utils/env';
import path from 'path';

const isTest = Boolean(process.env.VITEST);

export default defineConfig({
	optimizeDeps: {
		include: ['ts-utils/**', 'drizzle-struct/**']
	},
	plugins: [sveltekit()],
	resolve: isTest
		? {
				conditions: ['browser', 'svelte', 'import', 'default']
			}
		: undefined,

	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		watch: process.argv.includes('watch'),
		environment: 'jsdom'
	},
	ssr: {
		noExternal: ['node-html-parser']
	},
	server: {
		port: config.network.port,
		host: '0.0.0.0',
		fs: {
			allow: [path.resolve(process.cwd(), config.tba_webhook.path)]
		},
		allowedHosts: [
			'dev.tsaxking.com',
			'dev.tatorscout.org',
			'tatorscout.org',
			'test.tatorscout.org',
			'sylvie.tatorscout.org',
			'sophie.tatorscout.org',
			'landon.tatorscout.org',
			'anvita.tatorscout.org',
			'daniel.tatorscout.org',
			'kynlee.tatorscout.org'
		]
	},
	define: {
		__APP_ENV__: JSON.stringify({
			environment: config.environment,
			name: config.app_name,
			indexed_db: config.indexed_db,
			struct_cache: config.struct_cache,
			struct_batching: config.struct_batching,
			sse: config.sse,
			do_potato: config.potato.enabled
		})
	}
});
