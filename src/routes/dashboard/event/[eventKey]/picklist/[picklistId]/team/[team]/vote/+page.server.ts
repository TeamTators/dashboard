import * as TBA from '$lib/server/utils/tba';
import { fail, redirect } from '@sveltejs/kit';
import { ServerCode } from 'ts-utils/status';
import { Picklist } from '$lib/server/structs/picklist.js';

export const load = async (event) => {
	if (!event.locals.account) throw redirect(ServerCode.temporaryRedirect, '/account/sign-in');

	const e = await TBA.Event.getEvent(event.params.eventKey).unwrap();

	const picklist = await Picklist.Picklist.fromId(event.params.picklistId).unwrap();
	if (!picklist) throw fail(404);

	const teamNumber = Number(event.params.team);
	if (isNaN(teamNumber)) throw fail(400, { message: 'Invalid team number' });

	const teams = await e.getTeams().unwrap();
	const team = teams.find((t) => t.tba.team_number === teamNumber);
	if (!team) throw fail(404, { message: 'Team not found in event' });

	return {
		event: e.tba,
		picklist: picklist.safe(),
		teams: teams.map((t) => t.tba),
		teamNumber
	};
};
