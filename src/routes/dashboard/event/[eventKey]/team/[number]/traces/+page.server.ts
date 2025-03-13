import * as TBA from '$lib/server/utils/tba';
import { fail, redirect } from '@sveltejs/kit';
import { ServerCode } from 'ts-utils/status';
import { Scouting } from '$lib/server/structs/scouting';

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

	const scouting = (await Scouting.getTeamScouting(parseInt(event.params.number), eventKey));

	if (scouting.isErr()) {
		throw fail(ServerCode.internalServerError, {
			message: 'Failed to get scouting data'
		});
	}

	return {
		event: e.value.tba,
		team: team.tba,
		teams: teams.value.map((t) => t.tba),
		scouting: scouting.value.map(s => s.safe()),
	};
};
