/**
 * @fileoverview Client load mapper for mentor account management.
 * @description
 * Wraps account and role payloads into client-side model instances.
 */

import { Account } from '$lib/model/account.js';
import { Permissions } from '$lib/model/permissions.js';

/**
 * Maps server data into client-side account models.
 * @param event - SvelteKit load event with server data.
 * @returns Page data containing account and role models.
 */
export const load = (event) => {
	return {
		accounts: event.data.accounts.map((d) => ({
			account: Account.Account.Generator(d.account),
			admin: d.admin,
			developer: d.developer,
			// roles: d.roles.map((r) => Permissions.Role.Generator(r)),
			roles: [],
			// entitlements: Array.from(
			// 	new Set(
			// 		d.roles
			// 			.map((r) => {
			// 				try {
			// 					return z.array(z.string()).parse(JSON.parse(r.entitlements));
			// 				} catch (error) {
			// 					console.error(error);
			// 					return [];
			// 				}
			// 			})
			// 			.flat()
			// 	)
			// )
			entitlements: []
		})),
		roles: event.data.roles.map((r) => Permissions.Role.Generator(r))
	};
};
