import { Scouting } from '$lib/model/scouting.js';
import { TBAEvent, TBAMatch, TBATeam } from '$lib/utils/tba.js';

export const load = (event) => {
	const e = new TBAEvent(event.data.event);
	const team = new TBATeam(event.data.team, e);
	const teams = event.data.teams.map((t) => new TBATeam(t, e));
	const match = new TBAMatch(event.data.match, e);
	const matches = event.data.matches.map((m) => new TBAMatch(m, e));
	const scouting = event.data.scouting
		? Scouting.MatchScouting.Generator(event.data.scouting)
		: undefined;

	return {
		team,
		teams,
		event: e,
		match,
		matches,
		scouting,
		account: event.data.account
	};
};
