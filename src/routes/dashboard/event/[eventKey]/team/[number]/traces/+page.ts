/**
 * @fileoverview Client load mapper for the team trace view.
 * @description
 * Wraps server payloads into TBA models and scouting collections for traces.
 * Preserves the scout username mapping for UI attribution.
 */

import { TBAEvent, TBAMatch, TBATeam } from '$lib/utils/tba.js';
import { Scouting } from '$lib/model/scouting';

/**
 * Maps server data into client-side trace models.
 * @param event - SvelteKit load event with server data.
 * @returns Page data containing event, team, traces, match list, and scout map.
 */
export const load = (event) => {
	const e = new TBAEvent(event.data.event);
	return {
		event: e,
		teams: event.data.teams.map((t) => new TBATeam(t, e)),
		team: new TBATeam(event.data.team, e),
		scouting: Scouting.MatchScouting.arr(
			event.data.scouting.map((s) => Scouting.MatchScouting.Generator(s))
		),
		matches: event.data.matches.map((m) => new TBAMatch(m, e)),
		scoutingAccounts: event.data.scoutingAccounts
	};
};
