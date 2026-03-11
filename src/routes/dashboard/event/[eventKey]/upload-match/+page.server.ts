/**
 * @fileoverview Server loader for the event match upload page.
 * @description
 * Fetches event metadata required to associate uploaded match files.
 */

import { Event } from '$lib/server/utils/tba.js';

/**
 * Loads event metadata for the upload page.
 * @param event - SvelteKit request event.
 * @returns Page data containing the event payload.
 */
export const load = async (event) => {
	const e = await Event.getEvent(event.params.eventKey).unwrap();

	return {
		event: e.tba
	};
};
