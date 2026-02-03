/**
 * @fileoverview Client load mapper for the pit scouting editor.
 * @description
 * Derives the event year from the event key and forwards server data.
 */

/**
 * Maps server data into client-side props.
 * @param event - SvelteKit load event with server data.
 * @returns Page data including event key, year, and event metadata.
 */
export const load = (event) => {
	const year = /(^\d+)/.exec(event.params.eventKey)?.[0];
	return {
		eventKey: event.data.eventKey,
		year: Number(year),
		event: event.data.event
	};
};

export const ssr = false;
