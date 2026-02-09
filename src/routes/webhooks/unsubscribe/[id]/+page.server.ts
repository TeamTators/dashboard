import { Webhooks } from '$lib/server/structs/webhooks.js';
import { fail } from '@sveltejs/kit';

export const load = async (event) => {
	const sub = await Webhooks.Subscriptions.fromId(event.params.id).unwrap();
	if (!sub) throw fail(404, 'Subscription Not found');

	return {
		sub: sub.safe()
	};
};
