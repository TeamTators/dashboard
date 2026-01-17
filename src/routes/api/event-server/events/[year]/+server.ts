import * as TBA from '$lib/server/utils/tba.js';
import { auth } from '$lib/server/utils/auth-api.js';

export const GET = async (event) => {
	auth(event);
	const year = parseInt(event.params.year);
	if (isNaN(year)) {
		return new Response('Invalid year', { status: 400 });
	}

	const res = await TBA.Event.getEvents(year);
	if (res.isErr()) {
		return new Response('Internal server error', { status: 500 });
	}

	return new Response(JSON.stringify(res.value.map((e) => e.tba)), {
		headers: {
			'Content-Type': 'application/json'
		}
	});
};
