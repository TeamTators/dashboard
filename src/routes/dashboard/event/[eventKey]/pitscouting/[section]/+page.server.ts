import { TBAEvent } from '$lib/utils/tba.js';

export const load = async (event) => {
	const e = (await TBAEvent.getEvent(event.params.eventKey)).unwrap();
	const teams = (await e.getTeams()).unwrap();
	return {
		event: e.tba,
		teams: teams.map((t) => t.tba),
		section: event.params.section,
		eventKey: event.params.eventKey
	};
};
