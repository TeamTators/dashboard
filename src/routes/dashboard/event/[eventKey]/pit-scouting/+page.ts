import { Scouting } from '$lib/model/scouting.js';
import { DataArr } from '$lib/services/struct/data-arr';

export const load = (event) => {
	return {
		event: event.data.event,
		sections: new DataArr(
			Scouting.PIT.Sections,
			event.data.sections.map((s) => Scouting.PIT.Sections.Generator(s))
		)
	};
};
