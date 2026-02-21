/**
 * @fileoverview API endpoint for fetching a single team by number.
 * @description
 * Proxies the TBA request and returns a simplified team payload.
 */

import { TBA } from '$lib/server/structs/TBA';
import { json } from '@sveltejs/kit';

/**
 * Returns a team payload from TBA by team number.
 * @param event - SvelteKit request event.
 * @returns A JSON response containing the team record.
 */
export const GET = async (event) => {
	const res = await TBA.get(`/team/${event.params.teamNumber}`, {
		updateThreshold: 1000 * 60 * 60 * 24
	});

	if (res.isErr()) {
		return json(
			{
				error: 'Failed to load team data'
			},
			{
				status: 500
			}
		);
	}

	return json({
		team: res.value
	});
};
