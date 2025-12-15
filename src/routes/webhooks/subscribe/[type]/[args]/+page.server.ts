import { Webhooks } from '$lib/server/structs/webhooks.js';
import { redirect } from '@sveltejs/kit';

export const load = async (event) => {
	if (!event.locals.account) {
		throw redirect(303, '/account/sign-in');
	}
	const { type, args } = event.params;
	const has = await Webhooks.Subscriptions.get(
		{
			type,
			args,
			accountId: event.locals.account.id
		},
		{
			type: 'single'
		}
	).unwrap();
	if (has) {
		throw redirect(303, `/account/subscriptions`);
	}
};
