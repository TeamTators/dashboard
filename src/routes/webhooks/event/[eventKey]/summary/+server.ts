import { summarize } from '$lib/server/utils/google-summary.js';
import { fail } from '@sveltejs/kit';
import { ServerCode } from 'ts-utils/status';

export const GET = async (event) => {
	// auth(event);
	const data = await summarize(event.params.eventKey);
	if (data.isErr())
		throw fail(ServerCode.internalServerError, {
			error: data.error.message
		});

	const res = await data.value.serialize();

	if (res.isErr())
		throw fail(ServerCode.internalServerError, {
			error: res.error.message
		});

	return new Response(
		JSON.stringify({
			summary: res.value
		}),
		{
			status: 200,
			headers: {
				'Content-Type': 'application/json'
			}
		}
	);
};
