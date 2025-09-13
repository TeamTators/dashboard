import { Scouting } from '$lib/server/structs/scouting.js';
import { redirect } from '@sveltejs/kit';
import { ServerCode } from 'ts-utils/status';
import { Event } from '$lib/server/utils/tba.js';

export const load = async (event) => {
	if (!event.locals.account) throw redirect(ServerCode.temporaryRedirect, '/account/sign-in');
	const e = (await Event.getEvent(event.params.eventKey)).unwrap();
	const sections = (
		await Scouting.PIT.Sections.fromProperty('eventKey', event.params.eventKey, {
			type: 'stream'
		}).await()
	).unwrap();
	return {
		event: e.tba,
		sections: sections.map((s) => s.safe())
	};
};
