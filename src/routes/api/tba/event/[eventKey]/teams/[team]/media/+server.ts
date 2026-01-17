import * as TBA from '$lib/server/utils/tba';
import terminal from '$lib/server/utils/terminal.js';
import { fail } from '@sveltejs/kit';
import { ServerCode } from 'ts-utils/status';

export const GET = async (event) => {
	const e = await TBA.Event.getEvent(event.params.eventKey);
	if (e.isErr()) {
		terminal.error(e.error);
		throw fail(ServerCode.internalServerError);
	}

	const teams = await e.value.getTeams();
	if (teams.isErr()) {
		terminal.error(teams.error);
		throw fail(ServerCode.internalServerError);
	}

	const team = teams.value.find((t) => t.tba.team_number === parseInt(event.params.team));
	if (!team) {
		throw fail(ServerCode.notFound);
	}

	const media = await team.getMedia();
	if (media.isErr()) {
		terminal.error(media.error);
		throw fail(ServerCode.internalServerError);
	}

	return new Response(JSON.stringify(media.value), {
		headers: {
			'Content-Type': 'application/json'
		},
		status: ServerCode.ok
	});
};
