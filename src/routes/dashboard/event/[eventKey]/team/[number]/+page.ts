import { TBAEvent, TBATeam } from '$lib/utils/tba.js';

export const load = (event) => {
	const e = new TBAEvent(event.data.event);
	return {
		event: e,
		team: new TBATeam(event.data.team, e),
		teams: event.data.teams.map((t) => new TBATeam(t, e))
	};
};
