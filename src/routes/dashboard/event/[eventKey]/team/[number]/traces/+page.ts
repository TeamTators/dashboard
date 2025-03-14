import { TBAEvent, TBATeam } from '$lib/utils/tba.js';
import { Scouting } from '$lib/model/scouting';
import { DataArr } from 'drizzle-struct/front-end';

export const load = (event) => {
	const e = new TBAEvent(event.data.event);
	return {
		event: e,
		teams: event.data.teams.map((t) => new TBATeam(t, e)),
		team: new TBATeam(event.data.team, e),
		scouting: new DataArr(
			Scouting.MatchScouting,
			event.data.scouting.map((s) => Scouting.MatchScouting.Generator(s))
		)
	};
};
