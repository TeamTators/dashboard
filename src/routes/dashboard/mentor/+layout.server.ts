/**
 * @fileoverview Server layout guard for mentor dashboard routes.
 * @description
 * Redirects unauthenticated users or unverified accounts away from mentor pages.
 */

import { redirect } from '@sveltejs/kit';
import { ServerCode } from 'ts-utils/status';

/**
 * Enforces mentor dashboard access requirements.
 * @param event - SvelteKit request event.
 * @returns Nothing; throws redirects when access is invalid.
 */
export const load = (event) => {
	if (!event.locals.account) {
		throw redirect(ServerCode.temporaryRedirect, '/account/sign-in');
	}
	if (!event.locals.account.data.verified) {
		throw redirect(ServerCode.permanentRedirect, '/account/not-verified');
	}
};
