import { browser } from '$app/environment';
import { sse } from '$lib/services/sse';
import { Struct } from '$lib/services/struct';
import { attemptAsync } from 'ts-utils';
import { Account } from './account';

export namespace Webhooks {
	export const Subscriptions = new Struct({
		name: 'webhook_subscriptions',
		structure: {
			accountId: 'string',
			type: 'string',
			args: 'string',
			email: 'boolean',
			popup: 'boolean',
			discord: 'boolean'
		},
		socket: sse,
		browser
	});

	export type SubscriptionData = typeof Subscriptions.sample;
	export type SubscriptionDaraArr = ReturnType<typeof Subscriptions.arr>;

	export const subscribe = (
		type: string,
		args: string,
		email: boolean,
		popup: boolean,
		discord: boolean
	) => {
		return attemptAsync(async () => {
			const self = await Account.getSelfAsync().unwrap();
			return Subscriptions.new({
				accountId: String(self.data.id),
				type,
				args,
				email,
				popup,
				discord
			}).unwrap();
		});
	};
}
