import * as TBA from '$lib/server/utils/tba';
import terminal from '$lib/server/utils/terminal.js';
import { fail } from '@sveltejs/kit';
import { ServerCode } from 'ts-utils/status';

export const GET = async (event) => {
	const force = event.url.searchParams.get('force') === 'true';
	const e = await TBA.Event.getEvent(event.params.eventKey);
	if (e.isErr()) {
		terminal.error(e.error);
		throw fail(ServerCode.internalServerError);
	}

	const matches = await e.value.getMatches(force);
	if (matches.isErr()) {
		terminal.error(matches.error);
		throw fail(ServerCode.internalServerError);
	}

	return new Response(JSON.stringify(matches.value.map((m) => m.tba)), {
		headers: {
			'Content-Type': 'application/json'
		},
		status: ServerCode.ok
	});
};

// export const POST = async (event) => {

// };
