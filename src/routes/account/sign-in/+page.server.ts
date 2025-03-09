import { fail, redirect } from '@sveltejs/kit';
import { Account } from '$lib/server/structs/account.js';
import { Session } from '$lib/server/structs/session.js';
import { ServerCode } from 'ts-utils/status';
import { z } from 'zod';
import { OAuth2Client } from 'google-auth-library';
import { SECRET_OAUTH2_CLIENT_ID, SECRET_OAUTH2_CLIENT_SECRET } from '$env/static/private';
import terminal from '$lib/server/utils/terminal';

// const log = (...args: unknown[]) => console.log('[oauth/sign-in]', ...args);

export const actions = {
	login: async (event) => {
		const data = await event.request.formData();
		const res = z
			.object({
				username: z.string(),
				password: z.string()
			})
			.safeParse({
				username: data.get('user'),
				password: data.get('password')
			});
		if (!res.success) {
			terminal.error(res.error);
			return fail(ServerCode.badRequest, {
				message: 'Invalid form data',
				user: data.get('user')
			});
		}

		let account: Account.AccountData | undefined;

		ACCOUNT: {
			const user = await Account.Account.fromProperty('username', res.data.username, {
				type: 'single'
			});
			if (user.isErr()) {
				return fail(ServerCode.internalServerError, {
					user: res.data.username,
					message: 'Failed to get user'
				});
			}
			account = user.value;
			if (account) break ACCOUNT;

			const email = await Account.Account.fromProperty('email', res.data.username, {
				type: 'single'
			});
			if (email.isErr()) {
				return fail(ServerCode.internalServerError, {
					user: res.data.username,
					message: 'Failed to get user'
				});
			}
			account = email.value;
			if (account) break ACCOUNT;

			return fail(ServerCode.badRequest, {
				user: res.data.username,
				message: 'Invalid username or email'
			});
		}

		const pass = Account.hash(res.data.password, account.data.salt);
		if (pass.isErr()) {
			terminal.error(pass.error);
			return fail(ServerCode.internalServerError, {
				user: res.data.username,
				message: 'Failed to hash password'
			});
		}

		HASH: if (pass.value !== account.data.key) {
			const success = await Account.externalHash({
				user: res.data.username,
				pass: res.data.password,
			});

			if (success.isOk() && success.value) {
				// Update the password in this database
				const newHash = Account.newHash(res.data.password);
				if (newHash.isErr()) {
					terminal.error(newHash.error);
					return fail(ServerCode.internalServerError, {
						user: res.data.username,
						message: 'Failed to hash password'
					});
				}

				account.update({
					key: newHash.value.hash,
					salt: newHash.value.salt,
				});
				break HASH;
			}

			return fail(ServerCode.unauthorized, {
				user: res.data.username,
				message: 'Invalid username or password'
			});
		}

		const sessionRes = await Session.signIn(account, event.locals.session);
		if (sessionRes.isErr()) {
			terminal.error(sessionRes.error);
			return fail(ServerCode.internalServerError, {
				user: res.data.username,
				message: 'Failed to sign in'
			});
		}

		return {
			message: 'Logged in',
			user: res.data.username,
			redirect: event.locals.session.data.prevUrl || '/',
			success: true
		};
	},
	OAuth2: async () => {
		const domain = String(process.env.PUBLIC_DOMAIN).includes('localhost')
			? `${process.env.PUBLIC_DOMAIN}:${process.env.PORT}`
			: process.env.PUBLIC_DOMAIN;
		const client = new OAuth2Client({
			clientSecret: SECRET_OAUTH2_CLIENT_SECRET,
			clientId: SECRET_OAUTH2_CLIENT_ID,
			redirectUri:
				process.env.HTTPS === 'true' ? 'https://' : 'http://' + domain + '/account/oauth/sign-in'
		});
		// log(client);
		const authorizeUrl = client.generateAuthUrl({
			access_type: 'offline',
			// scope: 'https://www.googleapis.com/auth/userinfo.profile openid email',
			scope: [
				'https://www.googleapis.com/auth/userinfo.profile',
				'https://www.googleapis.com/auth/userinfo.email',
				'openid'
			],
			prompt: 'consent'
		});
		// log(authorizeUrl);

		throw redirect(ServerCode.temporaryRedirect, authorizeUrl);
	},
	'request-password-reset': async (event) => {
		const formdata = await event.request.formData();
		const user = z.string().safeParse(formdata.get('user'));
		terminal.log(user);
		const exit = () => ({
			redirect: '/account/password-reset'
		});
		if (!user.success) {
			terminal.error(user.error);
			return exit();
		}

		let account = await Account.Account.fromProperty('username', user.data, { type: 'single' });
		if (account.isErr()) {
			terminal.error(account.error);
			return exit();
		}

		if (!account.value) {
			account = await Account.Account.fromProperty('email', user.data, { type: 'single' });
			if (account.isErr()) {
				terminal.error(account.error);
				return exit();
			}
		}

		if (!account.value) {
			return exit();
		}

		const reset = await Account.requestPasswordReset(account.value);

		if (reset.isErr()) {
			terminal.error(reset.error);
		}

		return exit();
	}
};
