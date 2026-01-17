import { z } from 'zod';
import terminal from '$lib/server/utils/terminal';
import { ServerCode } from 'ts-utils/status';
import { str } from '$lib/server/utils/env.js';
import { auth } from '$lib/server/utils/auth-api.js';

export const POST = async (event) => {
	auth(event);

	const res = (message: string, status: ServerCode) =>
		new Response(JSON.stringify({ message }), { status });

	const body = await event.request.json();

	const parsed = z.array(z.unknown()).safeParse(body);

	if (!parsed.success) {
		terminal.warn('Invalid request body', parsed.error.message);
		return res('Invalid request body: ' + parsed.error.message, 400);
	}
	terminal.log('Received batch match submission request', parsed.data.length);

	const results = await Promise.all(
		parsed.data.map((i) =>
			event
				.fetch('/event-server/submit-match', {
					body: JSON.stringify(i),
					method: 'POST',
					headers: {
						'X-API-KEY': str('EVENT_SERVER_API_KEY', true),
						'Content-Type': 'application/json'
					}
				})
				.then((r) => r.json())
				.catch(() => ({
					success: false,
					message: 'Failed to submit match'
				}))
		)
	);

	return new Response(JSON.stringify(results), { status: 200 });
};
