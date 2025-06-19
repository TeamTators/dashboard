import * as TBA from '$lib/server/utils/tba';
import terminal from '$lib/server/utils/terminal.js';
import { fail, json } from '@sveltejs/kit';
import { EventSchema } from 'tatorscout/tba';
import { ServerCode } from 'ts-utils/status';

export const GET = async (event) => {
	const e = await TBA.Event.getEvent(event.params.eventKey);
	if (e.isErr()) {
		terminal.error(e.error);
		throw fail(ServerCode.internalServerError);
	}

	return new Response(JSON.stringify(e.value.tba), {
		headers: {
			'Content-Type': 'application/json'
		},
		status: ServerCode.ok
	});
};

export const POST = async (event) => {
	if (!event.locals.account) {
		return json({
			success: false,
			message: 'You must be signed in to create an event.'
		}, { status: ServerCode.unauthorized });
	}

	const data = await event.request.json();

	const parsed = EventSchema.safeParse(data);
	if (!parsed.success) {
		terminal.error('Invalid event data:', parsed.error);
		return json({
			success: false,
			message: 'Invalid event data.'
		}, { status: ServerCode.badRequest });
	}
	const e = await TBA.Event.getEvent(event.params.eventKey);
	if (e.isErr()) {
		terminal.error(e.error);
		return json({
			success: false,
			message: 'Event not found.'
		}, { status: ServerCode.notFound });
	}

	if (!e.value.custom) {
		return json({
			success: false,
			message: 'This event is not a custom event. You cannot modify it.'
		}, { status: ServerCode.forbidden });
	}

	const res = await e.value.update({
		...parsed.data,
		startDate: new Date(parsed.data.start_date),
		endDate: new Date(parsed.data.end_date)
	});

	if (res.isOk()) {
		return json({
			success: true,
			message: 'Event updated successfully.'
		});
	}

	return json({
		success: false,
		message: res.error.message
	}, { status: ServerCode.internalServerError });
};
