import { auth } from '$lib/server/utils/google-summary.js';

export const GET = (event) => {
	console.log('webhook ping event');
	auth(event);
	console.log('Success!');
	return new Response(
		JSON.stringify({
			status: 'success',
			message: 'Webhook pinged successfully!'
		}),
		{
			status: 200,
			headers: {
				'Content-Type': 'text/plain'
			}
		}
	);
};
