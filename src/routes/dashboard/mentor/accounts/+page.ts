import { Account } from '$lib/model/account.js';
import { Permissions } from '$lib/model/permissions.js';
import { z } from 'zod';

export const load = (event) => {
	return {
		accounts: event.data.accounts.map((d) => ({
			account: Account.Account.Generator(d.account),
			admin: d.admin,
			developer: d.developer,
<<<<<<< HEAD
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
=======
			roles: d.roles.map((r) => Permissions.Role.Generator(r)),
			entitlements: Array.from(
				new Set(
					d.roles
						.map((r) => {
							try {
								return z.array(z.string()).parse(JSON.parse(r.entitlements));
							} catch (error) {
								console.error(error);
								return [];
							}
						})
						.flat()
				)
			)
>>>>>>> origin
		})),
		roles: event.data.roles.map((r) => Permissions.Role.Generator(r))
	};
};
