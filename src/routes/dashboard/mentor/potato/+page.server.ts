/**
 * @fileoverview Server loader for the mentor potato leaderboard.
 * @description
 * Enforces access rules and returns potato rankings plus the current user's entry.
 */

import { Potato } from '$lib/server/structs/potato.js';
import { error, redirect } from '@sveltejs/kit';
import { ServerCode } from 'ts-utils/status';

/**
 * Loads potato leaderboard data for mentors.
 * @param event - SvelteKit request event.
 * @returns Page data containing rankings and the current user's potato entry.
 */
export const load = async (event) => {
	if (__APP_ENV__.do_potato) throw redirect(ServerCode.permanentRedirect, '/');
	if (!event.locals.account) throw redirect(ServerCode.temporaryRedirect, '/account/sign-in');

	if (!event.locals.account.data.verified) throw error(ServerCode.unauthorized);

	const rankings = (await Potato.getRankings()).unwrap();
	const you = rankings.find((r) => r.account.data.username === event.locals.account?.data.username);
	return {
		rankings: rankings.map((r) => ({
			account: r.account.safe(),
			potato: r.potato.safe()
		})),
		you: {
			account: you?.account?.safe(),
			potato: you?.potato.safe()
		}
	};
};
