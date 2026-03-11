/**
 * @fileoverview Client load mapper for the event checklist page.
 * @description
 * Converts server payloads into model wrappers and DataArr instances.
 */

import { Scouting } from '$lib/model/scouting.js';
import { TBAEvent, TBATeam } from '$lib/utils/tba.js';
import { DataArr } from '$lib/services/struct/data-arr';

/**
 * Transforms checklist data into client-side model instances.
 * @param event - SvelteKit load event with server data.
 * @returns Page data with wrapped event and checklist rows.
 */
export const load = (event) => {
	const e = new TBAEvent(event.data.event);
	return {
		event: e,
		data: event.data.data.map((d) => {
			const left = new DataArr(
				Scouting.PIT.Questions,
				d.left.map((q) => Scouting.PIT.Questions.Generator(q))
			);

			return {
				team: new TBATeam(d.team, e),
				left,
				// question: left.map((item) => item.data.key).join(','),
				uploaded: d.uploaded,
				tbaPictures: d.tba
			};
		})
	};
};
