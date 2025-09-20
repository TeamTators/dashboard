import * as TBA from '$lib/server/utils/tba';
import terminal from '$lib/server/utils/terminal.js';
import { json } from '@sveltejs/kit';
import { TeamSchema } from 'tatorscout/tba';
import { ServerCode } from 'ts-utils/status';

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

	const parsed = TeamSchema.safeParse(data);
	if (!parsed.success) {
		terminal.error('Invalid team data:', parsed.error);
		return json(
			{
				success: false,
				message: 'Invalid team data.'
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

	const res = await e.value.saveCustomTeam(parsed.data);

	if (res.isOk()) {
		return json({
			success: true,
			message: 'Team updated successfully.'
		});
	}

	return json(
		{
			success: false,
			message: res.error.message
		},
		{ status: ServerCode.internalServerError }
	);
};
