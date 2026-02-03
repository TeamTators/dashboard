/**
 * @fileoverview Client load mapper for the potato leaderboard dashboard.
 * @description
 * Wraps server ranking payloads into potato and account models.
 */

import { Potato } from '$lib/model/potato';
import { Account } from '$lib/model/account';

/**
 * Maps server data into client-side ranking models.
 * @param event - SvelteKit load event with server data.
 * @returns Page data containing rankings and the current user's entry.
 */
export const load = (event) => {
	return {
		rankings: event.data.rankings.map((r) => ({
			potato: Potato.Friend.Generator(r.potato),
			account: r.account ? Account.Account.Generator(r.account) : undefined
		})),
		you: {
			potato:
				event.data.you && event.data.you.potato
					? Potato.Friend.Generator(event.data.you.potato)
					: null,
			account: event.data.you.account
				? Account.Account.Generator(event.data.you.account)
				: undefined
		}
	};
};
