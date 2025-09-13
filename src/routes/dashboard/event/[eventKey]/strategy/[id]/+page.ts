import { Scouting } from '$lib/model/scouting.js';
import { Strategy } from '$lib/model/strategy';
import { TBAEvent, TBAMatch, TBATeam } from '$lib/utils/tba.js';
import { DataArr } from '$lib/services/struct/data-arr';

export const load = (event) => {
	const e = new TBAEvent(event.data.event);
	const teams = event.data.teams.map((t) => new TBATeam(t, e));
	const matches = event.data.matches.map((m) => new TBAMatch(m, e));

	return {
		event: e,
		teams: teams,
		matches: matches,
		strategy: Strategy.Strategy.Generator(event.data.strategy),
		partners: event.data.partners.map((p) => Strategy.Partners.Generator(p)),
		opponents: event.data.opponents.map((o) => Strategy.Opponents.Generator(o)),
		scouting: {
			partner1: new DataArr(
				Scouting.MatchScouting,
				event.data.scouting.partner1.map((s) => Scouting.MatchScouting.Generator(s))
			),
			partner2: new DataArr(
				Scouting.MatchScouting,
				event.data.scouting.partner2.map((s) => Scouting.MatchScouting.Generator(s))
			),
			partner3: new DataArr(
				Scouting.MatchScouting,
				event.data.scouting.partner3.map((s) => Scouting.MatchScouting.Generator(s))
			),
			opponent1: new DataArr(
				Scouting.MatchScouting,
				event.data.scouting.opponent1.map((s) => Scouting.MatchScouting.Generator(s))
			),
			opponent2: new DataArr(
				Scouting.MatchScouting,
				event.data.scouting.opponent2.map((s) => Scouting.MatchScouting.Generator(s))
			),
			opponent3: new DataArr(
				Scouting.MatchScouting,
				event.data.scouting.opponent3.map((s) => Scouting.MatchScouting.Generator(s))
			)
		}
	};
};
