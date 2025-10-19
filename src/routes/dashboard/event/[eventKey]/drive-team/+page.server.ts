import { Event } from '$lib/server/utils/tba.js';

export const load = async (event) => {
	const e = await Event.getEvent(event.params.eventKey).unwrap();
	const teams = await e.getTeams().unwrap();

	return {
		event: e.tba,
		teams: teams.map((t) => t.tba)
	};
};
