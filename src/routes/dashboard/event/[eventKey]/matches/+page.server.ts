import * as TBA from '$lib/server/utils/tba';
import { redirect, fail } from '@sveltejs/kit';
import { ServerCode } from 'ts-utils/status';
import { Scouting } from '$lib/server/structs/scouting.js';

export const load = async (event) => {
	if (!event.locals.account) throw redirect(ServerCode.temporaryRedirect, '/account/sign-in');
	const e = await TBA.Event.getEvent(event.params.eventKey);
	if (e.isErr()) {
		throw fail(404);
	}

	const [teams, matches] = await Promise.all([e.value.getTeams(), e.value.getMatches()]);

	if (teams.isErr()) throw fail(ServerCode.internalServerError);
	if (matches.isErr()) throw fail(ServerCode.internalServerError);

	const scouting = await Scouting.MatchScouting.fromProperty('eventKey', event.params.eventKey, {
		type: 'all'
	}).unwrap();

	return {
		event: e.value.tba,
		scouting: scouting.map((s) => ({
			matchNumber: s.data.matchNumber,
			compLevel: s.data.compLevel,
			team: s.data.team,
			eventKey: s.data.eventKey
		}))
	};
};
