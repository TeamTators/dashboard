/**
 * @fileoverview Client load mapper for the team match detail page.
 * @description
 * Wraps server payloads into TBA model instances and scouting generators.
 * Normalizes optional scouting data so the UI can handle missing scouts gracefully.
 */

import { Scouting } from '$lib/model/scouting.js';
import { TBAEvent, TBAMatch, TBATeam } from '$lib/utils/tba.js';

/**
 * Maps server data into client-side match and scouting models.
 * @param event - SvelteKit load event with server data.
 * @returns Page data containing event, team, match, scouting details, and account info.
 */
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
