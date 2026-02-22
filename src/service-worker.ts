/**
 * @fileoverview SvelteKit service worker for offline support.
 *
 * Implements a cache-first strategy for static assets and a network-first
 * strategy for API and navigation requests, enabling the dashboard to function
 * while offline.
 *
 * @see https://kit.svelte.dev/docs/service-workers
 */
/// <reference types="@sveltejs/kit" />
/// <reference lib="webworker" />

import { build, files, version } from '$service-worker';

declare let self: ServiceWorkerGlobalScope;

const CACHE_NAME = `app-cache-${version}`;

// All static assets that should be cached immediately on install.
const STATIC_ASSETS = [...build, ...files];

// URL path prefixes that should never be cached.
const NEVER_CACHE = ['/api/sse', '/api/analytics', '/api/oauth', '/api/struct'];

self.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(CACHE_NAME)
			.then((cache) => cache.addAll(STATIC_ASSETS))
			.then(() => self.skipWaiting())
	);
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) =>
				Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
			)
			.then(() => self.clients.claim())
	);
});

self.addEventListener('fetch', (event) => {
	const { request } = event;
	const url = new URL(request.url);

	// Only handle same-origin requests.
	if (url.origin !== self.location.origin) return;

	// Skip non-GET requests.
	if (request.method !== 'GET') return;

	// Skip endpoints that must always be live.
	if (NEVER_CACHE.some((prefix) => url.pathname.startsWith(prefix))) return;

	if (STATIC_ASSETS.includes(url.pathname)) {
		// Cache-first: serve from cache, fall back to network.
		event.respondWith(
			caches.match(request).then((cached) => cached ?? fetch(request))
		);
	} else {
		// Network-first: try network, fall back to cache.
		event.respondWith(
			caches.open(CACHE_NAME).then(async (cache) => {
				try {
					const response = await fetch(request);
					if (response.ok) {
						cache.put(request, response.clone());
					}
					return response;
				} catch {
					const cached = await cache.match(request);
					if (cached) return cached;
					// Return a minimal offline response for navigation requests.
					if (request.mode === 'navigate') {
						const fallback = await cache.match('/');
						if (fallback) return fallback;
					}
					return new Response('This page is not available offline. Please check your connection and try again.', { status: 503 });
				}
			})
		);
	}
});
