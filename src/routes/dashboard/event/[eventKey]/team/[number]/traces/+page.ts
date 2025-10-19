import { TBAEvent, TBAMatch, TBATeam } from '$lib/utils/tba.js';
import { Scouting } from '$lib/model/scouting';
import { DataArr } from '$lib/services/struct/data-arr';

export const load = (event) => {
	const e = new TBAEvent(event.data.event);
	return {
		event: e,
		teams: event.data.teams.map((t) => new TBATeam(t, e)),
		team: new TBATeam(event.data.team, e),
		scouting: event.data.scouting.map((s) => Scouting.MatchScouting.Generator(s)),
		matches: event.data.matches.map((m) => new TBAMatch(m, e)),
		scoutingAccounts: event.data.scoutingAccounts
	};
};
