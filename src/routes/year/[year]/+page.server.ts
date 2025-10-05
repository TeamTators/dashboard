import { Event } from '$lib/server/utils/tba';
import { redirect } from '@sveltejs/kit';
import { fail } from '@sveltejs/kit';
import { ServerCode } from 'ts-utils/status';

export const load = async (event) => {
	if (!event.locals.account) throw redirect(ServerCode.temporaryRedirect, '/account/sign-in');
	const year = parseInt(event.params.year);
	if (isNaN(year)) {
		throw fail(ServerCode.badRequest);
	}
	const events = await Event.getEvents(year);
	if (events.isErr()) {
		console.error(events.error);
		throw fail(ServerCode.internalServerError);
	}
	return {
		events: events.value.map((e) => e.tba)
	};
};
