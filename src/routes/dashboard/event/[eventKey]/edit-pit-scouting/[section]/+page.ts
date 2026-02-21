/**
 * @fileoverview Client load mapper for the pit scouting section editor.
 * @description
 * Wraps server payloads into model instances for the section editor UI.
 */

import { Scouting } from '$lib/model/scouting';

/**
 * Maps server data into client-side models for a single section.
 * @param event - SvelteKit load event with server data.
 * @returns Page data with section models and event metadata.
 */
export const load = (event) => {
	const year = /(^\d+)/.exec(event.params.eventKey)?.[0];
	return {
		section: Scouting.PIT.Sections.Generator(event.data.section),
		eventKey: event.data.eventKey,
		sections: event.data.sections.map((s) => Scouting.PIT.Sections.Generator(s)),
		year: Number(year),
		sectionIndex: event.data.sectionIndex,
		event: event.data.event
	};
};
