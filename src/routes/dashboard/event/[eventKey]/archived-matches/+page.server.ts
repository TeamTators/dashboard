import { Scouting } from '$lib/server/structs/scouting';
import * as TBA from '$lib/server/utils/tba';
import { redirect, fail } from '@sveltejs/kit';
import { Trace, TraceSchema, type TraceArray } from 'tatorscout/trace';
import { ServerCode } from 'ts-utils/status';

export const load = async (event) => {
	if (!event.locals.account) throw redirect(ServerCode.temporaryRedirect, '/account/sign-in');
	const e = await TBA.Event.getEvent(event.params.eventKey);
	if (e.isErr()) {
		throw redirect(ServerCode.temporaryRedirect, `/404?url${event.url.href}`);
	}

	const [teams, matches] = await Promise.all([e.value.getTeams(), e.value.getMatches()]);

	if (teams.isErr()) throw fail(ServerCode.internalServerError);
	if (matches.isErr()) throw fail(ServerCode.internalServerError);

	return {
		event: e.value.tba,
		teams: teams.value.map((t) => t.tba),
		matches: matches.value.map((m) => m.tba)
	};
};
