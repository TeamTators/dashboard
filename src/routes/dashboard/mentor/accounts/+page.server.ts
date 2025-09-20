import { DB } from '$lib/server/db/index.js';
import { Account } from '$lib/server/structs/account.js';
import { Permissions } from '$lib/server/structs/permissions.js';
import { redirect } from '@sveltejs/kit';
import { eq, sql } from 'drizzle-orm';
import { ServerCode } from 'ts-utils/status';

export const load = async (event) => {
	if (!event.locals.account) throw redirect(ServerCode.temporaryRedirect, '/account/sign-in');

	const accounts = (
		await Account.Account.all({
			type: 'stream'
		}).await()
	).unwrap();

	const roles = (
		await Permissions.Role.all({
			type: 'stream'
		}).await()
	).unwrap();

	return {
		accounts: await Promise.all(
			accounts.map(async (account) => {
				return {
					account: account.safe(),
					// roles: (await Permissions.allAccountRoles(account)).unwrap().map((r) => r.safe()),
					roles: [], // TODO: Fix this, it is not working with the new permissions system
					developer: (await Account.isDeveloper(account)).unwrap(),
					admin: (await Account.isAdmin(account)).unwrap()
				};
			})
		),
		roles: roles.map((r) => r.safe())
	};
};
