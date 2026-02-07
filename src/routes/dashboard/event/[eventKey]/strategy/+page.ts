/**
 * @fileoverview Client load mapper for the strategy list page.
 * @description
 * Wraps event, team, match, and strategy payloads into models.
 */

import { Strategy } from '$lib/model/strategy.js';
import { TBAEvent, TBAMatch, TBATeam } from '$lib/utils/tba.js';
import { DataArr } from '$lib/services/struct/data-arr';

/**
 * Maps server data into client-side models for strategies.
 * @param event - SvelteKit load event with server data.
 * @returns Page data containing event, teams, matches, and strategies.
 */
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
