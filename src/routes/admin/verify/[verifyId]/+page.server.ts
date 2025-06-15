import { Account } from '$lib/server/structs/account.js';
import { Session } from '$lib/server/structs/session.js';
import { Universes } from '$lib/server/structs/universe.js';
import terminal from '$lib/server/utils/terminal.js';
import { fail, redirect } from '@sveltejs/kit';
import { ServerCode } from 'ts-utils/status';

export const load = async (event) => {
	if (!event.locals.account) {
		throw redirect(ServerCode.temporaryRedirect, '/account/log-in');
	}

	const isAdmin = await Account.isAdmin(event.locals.account);
	if (isAdmin.isErr()) {
		terminal.error(isAdmin.error);
		throw fail(ServerCode.internalServerError);
	}

	if (!isAdmin.value) {
		throw redirect(ServerCode.permanentRedirect, '/status/403?url=' + event.url.href);
	}

	const verifyAccount = await Account.Account.fromProperty('verification', event.params.verifyId, {
		type: 'single'
	});

	if (verifyAccount.isErr()) {
		terminal.error(verifyAccount.error);
		throw fail(ServerCode.internalServerError);
	}

	if (!verifyAccount.value) {
		throw redirect(ServerCode.permanentRedirect, '/status/404?url=' + event.url.href);
	}

	return {
		account: verifyAccount.value.safe()
	};
};

export const actions = {
	verify: async (event) => {
		if (!event.locals.account) {
			throw redirect(ServerCode.temporaryRedirect, '/account/log-in');
		}

		const isAdmin = await Account.isAdmin(event.locals.account);
		if (isAdmin.isErr()) {
			terminal.error(isAdmin.error);
			throw fail(ServerCode.internalServerError);
		}

		if (!isAdmin.value) {
			throw redirect(ServerCode.permanentRedirect, '/status/403');
		}

		const verifyAccount = await Account.Account.fromProperty(
			'verification',
			event.params.verifyId,
			{
				type: 'single'
			}
		);

		if (verifyAccount.isErr()) {
			terminal.error(verifyAccount.error);
			throw fail(ServerCode.internalServerError);
		}

		if (!verifyAccount.value) {
			throw redirect(ServerCode.permanentRedirect, '/status/404?url=' + event.url.href);
		}

		const res = await Account.verify(verifyAccount.value);

		if (res.isErr()) {
			terminal.error(res.error);
			throw fail(ServerCode.internalServerError);
		}

		return {
			success: true
		};
	}
};
