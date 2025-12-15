import { Webhooks } from '$lib/server/structs/webhooks.js';
import { fail } from '@sveltejs/kit';

export const load = async (event) => {
	const alert = await Webhooks.WebhookAlerts.fromId(event.params.id).unwrap();
	if (!alert) throw fail(404, 'Alert Not found');
	return {
		alert: alert?.safe()
	};
};
