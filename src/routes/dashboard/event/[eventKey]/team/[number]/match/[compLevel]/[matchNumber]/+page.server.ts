/**
 * @fileoverview Server loader for a specific team match view.
 * @description
 * Resolves the requested match, scouting record, and scout account info.
 * Validates that the team participates in the requested match before returning data.
 */

import { Scouting } from '$lib/server/structs/scouting.js';
import * as TBA from '$lib/server/utils/tba';
import { fail, redirect } from '@sveltejs/kit';
import { ServerCode } from 'ts-utils/status';
import { Account } from '$lib/server/structs/account.js';
import terminal from '$lib/server/utils/terminal.js';

/**
 * Loads match data and scouting context for a specific team.
 * @param event - SvelteKit request event.
 * @returns Page data containing match details, scouting payload, and scout username.
 */
export const load = async (event) => {
	if (!event.locals.account) throw redirect(ServerCode.temporaryRedirect, '/account/sign-in');
	const eventKey = event.params.eventKey;
	const number = parseInt(event.params.number);

	const e = await TBA.Event.getEvent(eventKey);
	if (e.isErr()) {
		terminal.error('Failed to get event', e.error);
		throw fail(ServerCode.notFound, {
			message: 'Event not found'
		});
	}
	const teams = await e.value.getTeams();
	if (teams.isErr()) {
		terminal.error('Failed to get teams', teams.error);
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

	const matches = await team.getMatches();
	if (matches.isErr()) {
		terminal.error('Failed to get matches', matches.error);
		throw fail(ServerCode.internalServerError, {
			message: 'Failed to get matches'
		});
	}

	const match = matches.value.find(
		(m) =>
			m.tba.comp_level === event.params.compLevel &&
			m.tba.match_number === parseInt(event.params.matchNumber)
	);

	if (!match) {
		throw fail(ServerCode.notFound, {
			message: 'Match not found. The match may exist, but this team is not in it.'
		});
	}

	const scouting = await Scouting.getMatchScouting({
		team: team.tba.team_number,
		match: match.tba.match_number,
		compLevel: match.tba.comp_level,
		eventKey
	});

	if (scouting.isErr()) {
		terminal.error('Failed to get scouting', scouting.error);
		throw fail(ServerCode.internalServerError, {
			message: 'Failed to get scouting'
		});
	}

	const account = await Account.Account.fromId(scouting.value?.data.scoutId || '');

	if (account.isErr()) {
		terminal.error('Failed to get account', account.error);
		throw fail(ServerCode.internalServerError, {
			message: 'Failed to get account'
		});
	}

	return {
		team: team.tba,
		teams: teams.value.map((t) => t.tba),
		event: e.value.tba,
		match: match.tba,
		matches: matches.value.map((m) => m.tba),
		scouting: scouting.value?.safe(),
		account: account.value?.data.username
	};
};
