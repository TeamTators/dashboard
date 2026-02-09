import { command } from '$app/server';
import z from 'zod';
import { getAccount } from './index.remote';
import { error } from '@sveltejs/kit';
import { Webhooks } from '$lib/server/structs/webhooks';
import { sendEmail } from '$lib/server/services/email';
import { domain } from '$lib/server/utils/env';
import { Account } from '$lib/server/structs/account';

export const test = command(
	z.object({
		id: z.string()
	}),
	async ({ id }) => {
		const account = await getAccount();

		if (!account) {
			return error(401, 'Unauthorized');
		}

		if (!account.data.verified) {
			return error(403, 'Account not verified');
		}

		const res = await Webhooks.Subscriptions.fromId(id);
		if (res.isErr() || !res.value) {
			return error(404, 'Subscription not found');
		}

		if (res.value.data.email) {
			await sendEmail({
				type: 'tba-webhook',
				to: account.data.email,
				subject: 'Test TBA Webhook',
				data: {
					manage_subscriptions_url: domain({ port: false, protocol: true }) + '/account/webhooks',
					timestamp: new Date().toLocaleDateString(),
					type: res.value.data.type,
					username: account.data.username,
					view_event_url: domain({ port: false, protocol: true }) + `/webhooks/view/test`
				}
			});
		}
		if (res.value.data.popup) {
			await Account.notifyPopup(account.data.id, {
				icon: {
					type: 'material-icons',
					name: 'webhook'
				},
				title: 'Test TBA Webhook',
				message: `This is a test notification for the ${res.value.data.type} webhook subscription.`,
				severity: 'info'
			});
		}
	}
);
