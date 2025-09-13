import terminal from '$lib/server/utils/terminal';

export const GET = async (event) => {
	terminal.log('Event server request', event.request.url);
	const header = event.request.headers.get('X-API-KEY');

	if (String(header) !== String(process.env.EVENT_SERVER_API_KEY)) {
		return new Response('Unauthorized', { status: 401 });
	}

	return new Response('Pong', { status: 200 });
};
