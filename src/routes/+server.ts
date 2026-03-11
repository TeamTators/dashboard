/**
 * @fileoverview Debug handler for POST requests at the root route.
 * @description
 * Echoes receipt of the POST request and logs the request body.
 */

/**
 * Handles POST requests to the root route.
 * @param event - SvelteKit request event.
 * @returns A plain-text response acknowledging the POST.
 */
export const POST = async (event) => {
	console.log('POST request received at /');
	console.log('Request body:', await event.request.text());

	return new Response('POST request received', {
		status: 200,
		headers: {
			'Content-Type': 'text/plain'
		}
	});
};
