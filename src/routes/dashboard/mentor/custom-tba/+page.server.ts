/**
 * @fileoverview Server loader for the custom TBA dashboard overview.
 * @description
 * Validates mentor access and returns custom event records with parsed TBA payloads.
 */

import { TBA } from '$lib/server/structs/TBA.js';
import { redirect } from '@sveltejs/kit';
import { ServerCode } from 'ts-utils/status';
import { EventSchema } from 'tatorscout/tba';
import { error } from 'console';

/**
 * Loads custom TBA events for mentor management.
 * @param event - SvelteKit request event.
 * @returns Page data containing custom events and parsed TBA data.
 */
export const load = async (event) => {
	if (!event.locals.account) throw redirect(ServerCode.temporaryRedirect, '/account/sign-in');
	if (!event.locals.account.data.verified) throw error(ServerCode.unauthorized);

	const events = await TBA.Events.all({ type: 'all' }).unwrap();
	return {
		events: events.map((e) => ({
			event: e.safe(),
			data: EventSchema.parse(JSON.parse(e.data.data))
		}))
	};
};
