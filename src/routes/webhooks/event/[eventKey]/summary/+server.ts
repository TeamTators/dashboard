/**
 * @fileoverview Webhook endpoint for event summary exports.
 * @description
 * Generates a summarized report for the event using the summary pipeline.
 */

import { summarize } from '$lib/server/utils/google-summary.js';
import { fail } from '@sveltejs/kit';
import { ServerCode } from 'ts-utils/status';

/**
 * Returns the serialized event summary for the given event key.
 * @param event - SvelteKit request event.
 * @returns A JSON response containing the serialized summary.
 */
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
