/**
 * @fileoverview Server loader for the year events listing page.
 * @description
 * Fetches events for a given season year with optional cache bypass.
 */

import { Event } from '$lib/server/utils/tba';
import { redirect } from '@sveltejs/kit';
import { fail } from '@sveltejs/kit';
import { ServerCode } from 'ts-utils/status';

/**
 * Loads the list of events for the selected year.
 * @param event - SvelteKit request event.
 * @returns Page data containing the event list.
 */
export const load = async (event) => {
	if (!event.locals.account) throw redirect(ServerCode.temporaryRedirect, '/account/sign-in');
	const force = event.url.searchParams.get('force') === 'true';
	const year = parseInt(event.params.year);
	if (isNaN(year)) {
		throw fail(ServerCode.badRequest);
	}
	const events = await Event.getEvents(year, force);
	if (events.isErr()) {
		console.error(events.error);
		throw fail(ServerCode.internalServerError);
	}
	return {
		events: events.value.map((e) => e.tba)
	};
};
