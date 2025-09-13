import * as TBA from '$lib/server/utils/tba.js';
import terminal from '$lib/server/utils/terminal';

export const GET = async (event) => {
	terminal.log('Event server request', event.request.url);
	const header = event.request.headers.get('X-API-KEY');
	if (String(header) !== String(process.env.EVENT_SERVER_API_KEY)) {
		return new Response('Unauthorized', { status: 401 });
	}
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
