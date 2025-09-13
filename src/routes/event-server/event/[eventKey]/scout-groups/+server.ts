import terminal from '$lib/server/utils/terminal.js';
import * as TBA from '$lib/server/utils/tba.js';
import { generateScoutGroups, testAssignments } from 'tatorscout/scout-groups';

export const GET = async (event) => {
	terminal.log('Event server request', event.request.url);
	const header = event.request.headers.get('X-API-KEY');

	if (String(header) !== String(process.env.EVENT_SERVER_API_KEY)) {
		return new Response('Unauthorized', { status: 401 });
	}

	const e = await TBA.Event.getEvent(event.params.eventKey);
	if (e.isErr()) {
		return new Response('Event not found', { status: 404 });
	}

	const [teams, matches] = await Promise.all([e.value.getTeams(), e.value.getMatches()]);

	if (teams.isErr() || matches.isErr()) {
		return new Response('Internal server error', { status: 500 });
	}

	const assignments = generateScoutGroups(
		teams.value.map((t) => t.tba),
		matches.value.map((m) => m.tba)
	);

	const result = testAssignments(assignments);
	if (result.status === 'ok') {
		return new Response(JSON.stringify(assignments), {
			headers: {
				'Content-Type': 'application/json'
			}
		});
	}

	if (result.status === 'error') {
		terminal.error(result.error);
		return new Response('Internal server error', {
			status: 500
		});
	}

	terminal.error('Error generating scout groups', result.status, result.data);

	return new Response('Internal server error', {
		status: 500
	});
};
