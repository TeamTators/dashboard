import * as TBA from '$lib/server/utils/tba';
import terminal from '$lib/server/utils/terminal.js';
import { fail, json } from '@sveltejs/kit';
import { TeamSchema } from 'tatorscout/tba';
import { ServerCode } from 'ts-utils/status';
import { z } from 'zod';

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

	return new Response(JSON.stringify(teams.value.map((m) => m.tba)), {
		headers: {
			'Content-Type': 'application/json'
		},
		status: ServerCode.ok
	});
};

export const POST = async (event) => {
	if (!event.locals.account) {
		return json(
			{
				success: false,
				message: 'You must be signed in to create an event.'
			},
			{ status: ServerCode.unauthorized }
		);
	}

	const data = await event.request.json();

	const parsed = z.array(TeamSchema).safeParse(data);
	if (!parsed.success) {
		terminal.error('Invalid event data:', parsed.error);
		return json(
			{
				success: false,
				message: 'Invalid event data.'
			},
			{ status: ServerCode.badRequest }
		);
	}
	const e = await TBA.Event.getEvent(event.params.eventKey);
	if (e.isErr()) {
		terminal.error(e.error);
		return json(
			{
				success: false,
				message: 'Event not found.'
			},
			{ status: ServerCode.notFound }
		);
	}

	if (!e.value.custom) {
		return json(
			{
				success: false,
				message: 'This event is not a custom event. You cannot modify it.'
			},
			{ status: ServerCode.forbidden }
		);
	}

	e.value.setTeams(parsed.data);

	return json(
		{
			success: true,
			message: 'Teams updated successfully.'
		},
		{ status: ServerCode.ok }
	);
};
