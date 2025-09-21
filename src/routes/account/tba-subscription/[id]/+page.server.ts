import { Subscription } from '$lib/server/structs/subscription.js';
import { fail, redirect } from '@sveltejs/kit';
import { ServerCode } from 'ts-utils/status';

export const load = async (event) => {
	if (!event.locals.account) {
		throw fail(ServerCode.unauthorized, {
			message: 'You must be logged in to view this page'
		});
	}

	const sub = await Subscription.WebhookSubscription.fromId(event.params.id).unwrap();
	if (!sub) {
		throw fail(ServerCode.notFound, {
			message: 'Subscription not found'
		});
	}

	if (sub.data.accountId !== event.locals.account.id) {
		throw fail(ServerCode.forbidden, {
			message: 'You do not have permission to view this subscription'
		});
	}

	return {
		subscription: sub.safe()
	};
};

export const actions = {
	unsubscribe: async (event) => {
		if (!event.locals.account) {
			return fail(ServerCode.unauthorized, {
				message: 'You must be logged in to perform this action'
			});
		}

		const sub = await Subscription.WebhookSubscription.fromId(event.params.id).unwrap();
		if (!sub) {
			return fail(ServerCode.notFound, {
				message: 'Subscription not found'
			});
		}

		if (sub.data.accountId !== event.locals.account.id) {
			return fail(ServerCode.forbidden, {
				message: 'You do not have permission to perform this action'
			});
		}

		await sub.delete().unwrap();

		throw redirect(ServerCode.seeOther, '/account/tba-subscription/unsubscribed');
	}
};
