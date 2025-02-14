import { Scouting } from '$lib/model/scouting';

export const load = (event) => {
	return {
		section: Scouting.PIT.Sections.Generator(event.data.section),
		eventKey: event.data.eventKey,
		sections: event.data.sections.map((s) => Scouting.PIT.Sections.Generator(s)),
		teams: event.data.teams,
		team: event.data.team,
		sectionIndex: event.data.sectionIndex
	};
};
