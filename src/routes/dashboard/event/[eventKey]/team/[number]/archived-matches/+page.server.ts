/**
 * @fileoverview Server loader for a team's archived matches page.
 * @description
 * Loads event metadata and the selected team for archived match display.
 * Ensures the user is authenticated before serving team context.
 */

import * as TBA from '$lib/server/utils/tba';
import { fail, redirect } from '@sveltejs/kit';
import { ServerCode } from 'ts-utils/status';

/**
 * Loads event and team metadata for archived matches.
 * @param event - SvelteKit request event.
 * @returns Page data containing the event, team list, and selected team.
 */
export const load = async (event) => {
	if (!event.locals.account) throw redirect(ServerCode.temporaryRedirect, '/account/sign-in');
	const eventKey = event.params.eventKey;
	const number = parseInt(event.params.number);

	const e = await TBA.Event.getEvent(eventKey);
	if (e.isErr()) {
		throw fail(ServerCode.notFound, {
			message: 'Event not found'
		});
	}
	const teams = await e.value.getTeams();
	if (teams.isErr()) {
		throw fail(ServerCode.internalServerError, {
			message: 'Failed to get teams'
		});
	}

	const team = teams.value.find((t) => t.tba.team_number === number);
	if (!team) {
		throw fail(ServerCode.notFound, {
			message: 'Team not found'
		});
	}

	return {
		team: team.tba,
		teams: teams.value.map((t) => t.tba),
		event: e.value.tba
	};
};
