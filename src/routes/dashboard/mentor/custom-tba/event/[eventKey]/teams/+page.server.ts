import { Event } from '$lib/server/utils/tba.js';
import { error } from '@sveltejs/kit';
import { fail, redirect } from '@sveltejs/kit';
import { ServerCode } from 'ts-utils/status';

export const load = async (event) => {
	if (!event.locals.account) throw redirect(ServerCode.temporaryRedirect, '/account/sign-in');
	if (!event.locals.account.data.verified) throw error(ServerCode.unauthorized);

	const e = await Event.getEvent(event.params.eventKey);
	if (e.isErr()) {
		throw fail(404, {
			message: 'Event not found'
		});
	}

	const matches = await e.value.getMatches();
	if (matches.isErr()) {
		throw fail(500, {
			message: 'Failed to load matches for the event'
		});
	}

	const teams = await e.value.getTeams();
	if (teams.isErr()) {
		throw fail(500, {
			message: 'Failed to load teams for the event'
		});
	}

	return {
		event: e.value.tba,
		teams: teams.value.map((t) => t.tba)
	};
};
