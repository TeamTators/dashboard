/**
 * @fileoverview Webhook endpoint for event summary exports.
 * @description
 * Generates a summarized report for the event using the summary pipeline.
 */

import { summarize as summarize2025 } from '$lib/server/utils/google-summary/2025';
import { summarize as summarize2026 } from '$lib/server/utils/google-summary/2026';
import { fail, json } from '@sveltejs/kit';
import { ServerCode } from 'ts-utils/status';

/**
 * Returns the serialized event summary for the given event key.
 * @param event - SvelteKit request event.
 * @returns A JSON response containing the serialized summary.
 */
export const GET = async (event) => {
	const year = parseInt(event.params.eventKey.slice(0, 4));
	if (isNaN(year) || ![2025, 2026].includes(year)) {
		throw fail(ServerCode.badRequest, {
			error: 'Invalid event key format. Year must be 2025 or 2026.'
		});
	}

	if (year === 2025) {
		const data = await summarize2025(event.params.eventKey);
		if (data.isErr())
			throw fail(ServerCode.internalServerError, {
				error: data.error.message
			});

		const res = await data.value.serialize();

		if (res.isErr())
			throw fail(ServerCode.internalServerError, {
				error: res.error.message
			});

		return json(res.value);
	}

	if (year === 2026) {
		const data = await summarize2026(event.params.eventKey);
		if (data.isErr())
			throw fail(ServerCode.internalServerError, {
				error: data.error.message
			});

		const res = await data.value.serialize();

		if (res.isErr())
			throw fail(ServerCode.internalServerError, {
				error: res.error.message
			});

		return json(res.value);
	}

	throw fail(ServerCode.badRequest, {
		error: 'Invalid event key format. Year must be 2025 or 2026.'
	});
};
