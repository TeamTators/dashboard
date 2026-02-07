/**
 * @fileoverview Server loader for a specific custom TBA event.
 * @description
 * Validates mentor access and returns event, match, and team data.
 */

import { Event } from '$lib/server/utils/tba.js';
import { fail, redirect } from '@sveltejs/kit';
import { ServerCode } from 'ts-utils/status';

/**
 * Loads event metadata, matches, and teams for a custom event.
 * @param event - SvelteKit request event.
 * @returns Page data containing event, matches, and teams.
 */
export const load = async (event) => {
	if (!event.locals.account) throw redirect(ServerCode.temporaryRedirect, '/account/sign-in');

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
		matches: matches.value.map((m) => m.tba),
		teams: teams.value.map((t) => t.tba)
	};
};
