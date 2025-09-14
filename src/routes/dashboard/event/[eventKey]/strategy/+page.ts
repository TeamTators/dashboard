import { Strategy } from '$lib/model/strategy.js';
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
		strategies: new DataArr(
			Strategy.Strategy,
			event.data.strategies.map((s) => Strategy.Strategy.Generator(s))
		)
	};
};
