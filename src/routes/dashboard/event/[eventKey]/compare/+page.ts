/**
 * @fileoverview Client load mapper for the team comparison page.
 * @description
 * Wraps server payloads into model instances for the UI.
 */

import { Scouting } from '$lib/model/scouting.js';
import { TBAEvent, TBAMatch, TBATeam } from '$lib/utils/tba.js';
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
		selectedTeams: event.data.selectedTeams.map((t) => {
			if (!t.team) throw new Error('Selected team data is missing team information');
			const res = Scouting.MatchScoutingExtendedArr.fromArr(
				t.scouting.map((s) => Scouting.MatchScouting.Generator(s))
			);
			if (res.isErr()) {
				console.error('Failed to parse scouting data for team', t.team.team_number, res.error);
				return {
					team: new TBATeam(t.team, e),
					scouting: new Scouting.MatchScoutingExtendedArr([])
				};
			}
			return {
				team: new TBATeam(t.team, e),
				scouting: res.value
			};
		}),
		matches: event.data.matches.map((m) => new TBAMatch(m, e))
	};
};
