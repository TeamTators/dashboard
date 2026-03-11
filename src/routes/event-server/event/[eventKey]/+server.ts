/**
 * @fileoverview Event server endpoint for event details.
 * @description
 * Requires an API key and returns event, team, and match data.
 */

import * as TBA from '$lib/server/utils/tba';
import terminal from '$lib/server/utils/terminal';
import { str } from '$lib/server/utils/env';

/**
 * Returns event metadata, teams, and matches for a given event key.
 * @param event - SvelteKit request event.
 * @returns A JSON response with event data or an error message.
 */
export const GET = async (event) => {
	terminal.log('Event server request', event.request.url);
	const header = event.request.headers.get('X-API-KEY');

	if (String(header) !== str('EVENT_SERVER_API_KEY', true)) {
		return new Response('Unauthorized', { status: 401 });
	}

	const e = await TBA.Event.getEvent(event.params.eventKey);
	if (e.isErr()) {
		return new Response('Event not found', { status: 404 });
	}

	const [teams, matches] = await Promise.all([e.value.getTeams(), e.value.getMatches()]);

	if (teams.isErr() || matches.isErr()) {
		return new Response('Internal Server Error', { status: 500 });
	}

	return new Response(
		JSON.stringify({
			event: e.value.tba,
			teams: teams.value.map((t) => t.tba),
			matches: matches.value.map((m) => m.tba)
		}),
		{
			headers: {
				'Content-Type': 'application/json'
			}
		}
	);
};
