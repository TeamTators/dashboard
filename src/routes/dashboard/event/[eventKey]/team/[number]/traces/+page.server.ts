/**
 * @fileoverview Server loader for a team's trace view.
 * @description
 * Loads scouting traces and match list for the selected team.
 * Builds a lookup map of scout usernames for trace attribution.
 */

import * as TBA from '$lib/server/utils/tba';
import { fail, redirect } from '@sveltejs/kit';
import { ServerCode } from 'ts-utils/status';
import { Scouting } from '$lib/server/structs/scouting';
import terminal from '$lib/server/utils/terminal';
import { Account } from '$lib/server/structs/account';

/**
 * Loads trace data and scouting accounts for a team.
 * @param event - SvelteKit request event.
 * @returns Page data containing traces, matches, and scout username map.
 */
export const load = async (event) => {
	if (!event.locals.account) throw redirect(ServerCode.temporaryRedirect, '/account/sign-in');
	const eventKey = event.params.eventKey;
	const number = parseInt(event.params.number);

	const e = await TBA.Event.getEvent(eventKey);
	if (e.isErr()) {
		terminal.error(e.error);
		throw fail(ServerCode.notFound, {
			message: 'Event not found'
		});
	}
	const teams = await e.value.getTeams();
	if (teams.isErr()) {
		terminal.error(teams.error);
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

	const matches = await e.value.getMatches();
	if (matches.isErr()) {
		terminal.error(matches.error);
		throw fail(ServerCode.internalServerError, {
			message: 'Failed to get matches'
		});
	}

	const scouting = await Scouting.getTeamScouting(team.tba.team_number, e.value.tba.key);
	if (scouting.isErr()) {
		terminal.error(scouting.error);
		throw fail(ServerCode.internalServerError, {
			message: 'Failed to get scouting data'
		});
	}

	const accounts: Record<string, string> = Object.fromEntries(
		(
			await Promise.all(
				scouting.value.map(async (s) => [
					s.data.id,
					// s.data.scoutUsername
					(await Account.Account.fromId(s.data.scoutId)).unwrap()?.data.username
				])
			)
		).filter((a) => a[1] !== undefined)
	);

	return {
		event: e.value.tba,
		team: team.tba,
		teams: teams.value.map((t) => t.tba),
		scouting: scouting.value.map((s) => s.safe()),
		matches: matches.value.map((m) => m.tba),
		scoutingAccounts: accounts
	};
};
