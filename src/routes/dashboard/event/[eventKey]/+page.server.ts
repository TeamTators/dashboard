import * as TBA from '$lib/server/utils/tba';
import { ServerCode } from 'ts-utils/status';
import { fail, redirect } from '@sveltejs/kit';

export const load = async (event) => {
	if (!event.locals.account) throw redirect(ServerCode.temporaryRedirect, '/account/sign-in');
	const e = await TBA.Event.getEvent(event.params.eventKey);
	if (e.isErr()) {
		throw fail(404);
	}

	return {
		event: e.value.tba
	};
};
