import * as TBA from '$lib/server/utils/tba';
import { fail, redirect } from '@sveltejs/kit';
import { ServerCode } from 'ts-utils/status';
import { Scouting } from "$lib/server/structs/scouting";
import terminal from '$lib/server/utils/terminal';

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

	const scouting = await Scouting.getTeamScouting(team.tba.team_number, e.value.tba.key);
	if (scouting.isErr()) {
		terminal.error(scouting.error);
		throw fail(ServerCode.internalServerError, {
			message: 'Failed to get scouting data',
		});
	}

	return {
		event: e.value.tba,
		team: team.tba,
		teams: teams.value.map((t) => t.tba),
		scouting: scouting.value.map(s => s.safe()),
	};
};
