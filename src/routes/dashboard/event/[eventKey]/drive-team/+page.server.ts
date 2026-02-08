/**
 * @fileoverview Server loader for the drive team dashboard.
 * @description
 * Fetches event and team lists for the drive team view.
 */

import { Event } from '$lib/server/utils/tba.js';

/**
 * Loads event data and teams for the drive team page.
 * @param event - SvelteKit request event.
 * @returns Page data containing event metadata and teams.
 */
export const load = async (event) => {
	const e = await Event.getEvent(event.params.eventKey).unwrap();
	const teams = await e.getTeams().unwrap();

	return {
		event: e.tba,
		teams: teams.map((t) => t.tba)
	};
};
