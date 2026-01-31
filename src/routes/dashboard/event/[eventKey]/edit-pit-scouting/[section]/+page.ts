import { Scouting } from '$lib/model/scouting';

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
