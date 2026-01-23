import { auth } from '$lib/server/utils/auth-api.js';

export const GET = async (event) => {
	auth(event);

	return new Response('Pong', { status: 200 });
};
