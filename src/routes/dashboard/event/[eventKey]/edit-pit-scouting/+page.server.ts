/**
 * @fileoverview Server loader for editing pit scouting sections.
 * @description
 * Validates access and loads the event metadata for editing.
 */

import { Event } from '$lib/server/utils/tba.js';
import { redirect, fail } from '@sveltejs/kit';
import { ServerCode } from 'ts-utils/status';

/**
 * Loads event data for the pit scouting editor.
 * @param event - SvelteKit request event.
 * @returns Page data with event info and key.
 */
export const load = async (event) => {
	if (!event.locals.account) throw redirect(ServerCode.temporaryRedirect, '/account/sign-in');
	const { eventKey } = event.params;
	const e = await Event.getEvent(eventKey);
	if (e.isErr())
		throw fail(ServerCode.notFound, {
			message: 'Event not found'
		});

	return {
		eventKey,
		event: e.value.tba
	};
};
