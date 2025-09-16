import { Account } from '$lib/server/structs/account';
import terminal from '$lib/server/utils/terminal';
import { str } from '$lib/server/utils/env';

export const GET = async (event) => {
	terminal.log('Event server request', event.request.url);
	const header = event.request.headers.get('X-API-KEY');

	if (String(header) !== str('EVENT_SERVER_API_KEY', true)) {
		return new Response('Unauthorized', { status: 401 });
	}

	const accounts = (
		await Account.Account.all({
			type: 'stream'
		}).await()
	).unwrap();

	return new Response(JSON.stringify(accounts.map((a) => a.data)), {
		headers: {
			'Content-Type': 'application/json'
		}
	});
};
