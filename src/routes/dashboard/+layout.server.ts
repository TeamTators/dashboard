import { redirect } from '@sveltejs/kit';
import { ServerCode } from 'ts-utils/status';

export const load = (event) => {
	if (!event.locals.account) {
		throw redirect(ServerCode.temporaryRedirect, '/account/sign-in');
	}
	if (!event.locals.account.data.verified) {
		throw redirect(ServerCode.permanentRedirect, '/account/not-verified');
	}
};
