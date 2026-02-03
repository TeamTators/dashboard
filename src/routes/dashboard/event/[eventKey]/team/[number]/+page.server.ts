/**
 * @fileoverview Server loader for the team detail page.
 * @description
 * Loads team scouting, comments, pit scouting data, and photos for the event.
 */

import { FIRST } from '$lib/server/structs/FIRST.js';
import { Scouting } from '$lib/server/structs/scouting.js';
import { Account } from '$lib/server/structs/account.js';
import * as TBA from '$lib/server/utils/tba';
import { fail, redirect } from '@sveltejs/kit';
import { ServerCode } from 'ts-utils/status';
import terminal from '$lib/server/utils/terminal';

/**
 * Loads team data, scouting records, and pit scouting info for the page.
 * @param event - SvelteKit request event.
 * @returns Page data with team details, scouting, comments, and media.
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

	const matches = await e.value.getMatches();
	if (matches.isErr()) {
		terminal.error(matches.error);
		throw fail(ServerCode.internalServerError, {
			message: 'Failed to get matches'
		});
	}

	const team = teams.value.find((t) => t.tba.team_number === number);
	if (!team) {
		throw fail(ServerCode.notFound, {
			message: 'Team not found'
		});
	}

	const [scouting, comments, pitScouting, pictures] = await Promise.all([
		Scouting.getTeamScouting(team.tba.team_number, e.value.tba.key),
		Scouting.getTeamComments(team.tba.team_number, e.value.tba.key),
		Scouting.PIT.getScoutingInfo(team.tba.team_number, e.value.tba.key),
		FIRST.TeamPictures.get(
			{
				team: team.tba.team_number,
				eventKey: e.value.tba.key
			},
			{
				type: 'all'
			}
		)
	]);

	if (scouting.isErr()) {
		terminal.error(scouting.error);
		throw fail(ServerCode.internalServerError);
	}

	if (comments.isErr()) {
		terminal.error(comments.error);
		throw fail(ServerCode.internalServerError);
	}

	if (pitScouting.isErr()) {
		terminal.error(pitScouting.error);
		throw fail(ServerCode.internalServerError);
	}

	if (pictures.isErr()) {
		terminal.error(pictures.error);
		throw fail(ServerCode.internalServerError);
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

	const checks: Record<string, string[]> = {};
	for (const s of scouting.value) {
		try {
			const parsedChecks = JSON.parse(s.data.checks);

			if (Array.isArray(parsedChecks) && parsedChecks.every((item) => typeof item === 'string')) {
				const key = s.data.eventKey + s.data.matchNumber;

				if (!checks[key]) {
					checks[key] = parsedChecks;
				} else {
					checks[key] = Array.from(new Set([...checks[key], ...parsedChecks]));
				}
			}
		} catch {
			// Skip if JSON.parse fails
		}
	}

	// console.log(accounts);

	return {
		team: team.tba,
		teams: teams.value.map((t) => t.tba),
		event: e.value.tba,
		scouting: scouting.value.map((s) => s.safe()),
		comments: comments.value.map((c) => c.safe()),
		answers: pitScouting.value.answers.map((a) => a.answer.safe()),
		questions: pitScouting.value.questions.map((q) => q.safe()),
		groups: pitScouting.value.groups.map((g) => g.safe()),
		sections: pitScouting.value.sections.map((s) => s.safe()),
		pictures: pictures.value.map((p) => p.safe()),
		answerAccounts: pitScouting.value.answers
			.map((a) => a.account)
			.filter(Boolean)
			.map((a) => a.safe()),
		matches: matches.value.map((m) => m.tba),
		scoutingAccounts: accounts,
		checksSum: checks
	};
};
