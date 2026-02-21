/**
 * @fileoverview Client load mapper for the drive team page.
 * @description
 * Wraps event and team payloads into model instances.
 */

import { TBAEvent, TBATeam } from '$lib/utils/tba.js';

/**
 * Maps server data into client-side models.
 * @param event - SvelteKit load event with server data.
 * @returns Page data containing the wrapped event and teams.
 */
export const load = (event) => {
	const e = new TBAEvent(event.data.event);
	return {
		event: e,
		teams: event.data.teams.map((t) => new TBATeam(t, e))
	};
};
