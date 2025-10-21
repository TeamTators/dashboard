import { Event } from '$lib/server/utils/tba.js';
import { redirect } from '@sveltejs/kit';
import { ServerCode } from 'ts-utils/status';

export const load = async (event) => {
	if (!event.locals.account) throw redirect(ServerCode.temporaryRedirect, '/account/sign-in');
	const e = (await Event.getEvent(event.params.eventKey)).unwrap();
	const teams = (await e.getTeams()).unwrap();
	return {
		event: e.tba,
		teams: teams.map((t) => t.tba),
		section: event.params.section,
		eventKey: event.params.eventKey
	};
};
