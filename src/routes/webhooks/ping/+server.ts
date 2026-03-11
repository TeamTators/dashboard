/**
 * @fileoverview Webhook ping endpoint.
 * @description
 * Returns a success payload for webhook health checks.
 */

/**
 * Returns a static success response.
 * @returns A JSON response indicating webhook availability.
 */
export const GET = () => {
	// console.log('webhook ping event');
	// auth(event);
	// console.log('Success!');
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
