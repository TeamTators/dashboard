/**
 * @fileoverview Server loader for the mentor dashboard home page.
 * @description
 * Ensures users are signed in and verified before viewing mentor tools.
 */

import { error } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { ServerCode } from 'ts-utils/status';

/**
 * Validates mentor dashboard access for the current user.
 * @param event - SvelteKit request event.
 * @returns Nothing; throws redirects or errors on failure.
 */
export const load = async (event) => {
	if (!event.locals.account) throw redirect(ServerCode.temporaryRedirect, '/account/sign-in');

	if (!event.locals.account.data.verified) throw error(ServerCode.unauthorized);
};
