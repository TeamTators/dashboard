/**
 * @fileoverview Server loader for the archived matches page.
 * @description
 * Loads event data, teams, matches, scouting records, and archived comments.
 */

import { Scouting } from '$lib/server/structs/scouting';
import * as TBA from '$lib/server/utils/tba';
import { redirect, fail } from '@sveltejs/kit';
import { ServerCode } from 'ts-utils/status';

/**
 * Loads archived match data for the event.
 * @param event - SvelteKit request event.
 * @returns Page data with event, teams, matches, comments, and scouting records.
 */
export const load = async (event) => {
	if (!event.locals.account) throw redirect(ServerCode.temporaryRedirect, '/account/sign-in');
	const e = await TBA.Event.getEvent(event.params.eventKey);
	if (e.isErr()) {
		throw fail(404);
	}

	const [teams, matches] = await Promise.all([e.value.getTeams(), e.value.getMatches()]);

	if (teams.isErr()) throw fail(ServerCode.internalServerError);
	if (matches.isErr()) throw fail(ServerCode.internalServerError);

	const res = await Scouting.archivedCommentsFromEvent(event.params.eventKey).unwrap();
	const scouting = await Scouting.MatchScouting.get(
		{ eventKey: event.params.eventKey },
		{
			type: 'all'
		}
	).unwrap();

	return {
		event: e.value.tba,
		teams: teams.value.map((t) => t.tba),
		matches: matches.value.map((m) => m.tba),
		comments: res.map((c) => c.safe()),
		scouting: scouting.map((s) => s.safe())
	};
};
