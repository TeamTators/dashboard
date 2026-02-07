/**
 * @fileoverview Remote procedures for FIRST summaries.
 *
 * @description
 * Exposes a query to fetch or generate FIRST event summaries with permission checks.
 */
import { query } from '$app/server';
import { z } from 'zod';
import { getAccount } from './index.remote';
import { error } from '@sveltejs/kit';
import { FIRST } from '$lib/server/structs/FIRST';

/**
 * Fetch or generate a serialized FIRST event summary.
 *
 * @returns {ReturnType<typeof query>} Remote query handler.
 *
 * @example
 * ```ts
 * const res = await FIRSTRemote.getSummary({ eventKey: '2025miket' });
 * ```
 */
export const getSummary = query(
	z.object({
		eventKey: z.string()
	}),
	async ({ eventKey }) => {
		const account = await getAccount();
		if (!account) {
			return error(401, 'Unauthorized');
		}

		if (!account.data.verified) {
			return error(403, 'Forbidden');
		}

		const allowedYears = [2024, 2025];

		let yearFound: number | null = null;
		for (const y of allowedYears) {
			if (eventKey.endsWith(`${y}`)) {
				yearFound = y;
				break;
			}
		}

		if (!yearFound) {
			return error(400, 'No summary available for this event');
		}

		const exists = await FIRST.getSummary(eventKey, yearFound as 2024 | 2025);

		if (exists.isOk() && exists.value) {
			return {
				success: true,
				data: exists.value.serialize()
			};
		}

		const res = await FIRST.generateSummary(eventKey, yearFound as 2024 | 2025);
		if (res.isErr()) {
			return error(500, 'Failed to generate summary');
		}

		return {
			success: true,
			data: res.value.serialize()
		};
	}
);
