import { browser } from '$app/environment';
import { sse } from '$lib/services/sse';
import { Struct } from '$lib/services/struct';

export namespace Subscription {
	export const WebhookSubscription = new Struct({
		name: 'webhook_subscription',
		structure: {
			accountId: 'string',
			type: 'string',
			args: 'string'
		},
		socket: sse,
		browser
	});

	export type WebhookSubscriptionData = typeof WebhookSubscription.sample;

	export const subscribe = (type: string, args: string) => {
		return WebhookSubscription.call('create-subscription', {
			type,
			args
		});
	};

	export const unsubscribe = (subscription: WebhookSubscriptionData) => {
		return WebhookSubscription.call('delete-subscription', {
			id: subscription.data.id
		});
	};
}
