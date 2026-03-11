/**
 * @fileoverview Server loader for creating a custom TBA event.
 * @description
 * Ensures the user is authenticated and verified before showing the create form.
 */

import { error } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { ServerCode } from 'ts-utils/status';

/**
 * Validates mentor access to the custom event creation page.
 * @param event - SvelteKit request event.
 * @returns Nothing; throws redirects or errors when invalid.
 */
export const load = async (event) => {
	if (!event.locals.account) throw redirect(ServerCode.temporaryRedirect, '/account/sign-in');
	if (!event.locals.account.data.verified) throw error(ServerCode.unauthorized);
};
