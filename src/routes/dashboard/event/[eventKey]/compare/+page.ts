/**
 * @fileoverview Client load mapper for the team comparison page.
 * @description
 * Wraps server payloads into model instances for the UI.
 */

import { Scouting } from '$lib/model/scouting.js';
import { TBAEvent, TBAMatch, TBATeam } from '$lib/utils/tba.js';
import { DataArr } from '$lib/services/struct/data-arr';

/**
 * Maps server data into client-side models.
 * @param event - SvelteKit load event with server data.
 * @returns Page data with wrapped event, teams, matches, and scouting arrays.
 */
export const load = (event) => {
	const e = new TBAEvent(event.data.event);
	return {
		event: e,
		teams: event.data.teams.map((t) => new TBATeam(t, e)),
		selectedTeams: event.data.selectedTeams.map((t) => new TBATeam(t, e)),
		teamScouting: event.data.teamScouting.map(
			(ts) =>
				new DataArr(
					Scouting.MatchScouting,
					ts.map((s) => Scouting.MatchScouting.Generator(s))
				)
		),
		matches: event.data.matches.map((m) => new TBAMatch(m, e))
	};
};
