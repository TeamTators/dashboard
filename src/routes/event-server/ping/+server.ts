/**
 * @fileoverview Event server health check endpoint.
 * @description
 * Validates the API key and returns a simple pong response.
 */

import terminal from '$lib/server/utils/terminal';
import { str } from '$lib/server/utils/env';

/**
 * Returns a pong response for authenticated health checks.
 * @param event - SvelteKit request event.
 * @returns Plain-text response indicating service availability.
 */
export const GET = async (event) => {
	terminal.log('Event server request', event.request.url);
	const header = event.request.headers.get('X-API-KEY');

	if (String(header) !== str('EVENT_SERVER_API_KEY', true)) {
		return new Response('Unauthorized', { status: 401 });
	}

	return new Response('Pong', { status: 200 });
};
