import { DB } from '$lib/server/db/index.js';
import { Subscription } from '$lib/server/structs/subscription';
import { fail } from '@sveltejs/kit';
import { ilike, or } from 'drizzle-orm';
import { ServerCode } from 'ts-utils/status';

export const load = async (event) => {
	if (!event.locals.account) {
		throw fail(ServerCode.unauthorized, {
			message: 'You must be logged in to view this page'
		});
	}

	const search = event.url.searchParams.get('search');
	const limit = event.url.searchParams.get('limit') || '10';
	const page = event.url.searchParams.get('page') || '0';

	const subs = await DB.select()
		.from(Subscription.WebhookSubscription.table)
		.where(
			or(
				ilike(Subscription.WebhookSubscription.table.type, `%${search || ''}%`),
				ilike(Subscription.WebhookSubscription.table.args, `%${search || ''}%`)
			)
		)
		.limit(parseInt(limit))
		.offset(parseInt(page) * parseInt(limit));

	return {
		subscriptions: subs.map((s) => Subscription.WebhookSubscription.Generator(s).safe()),
		account: event.locals.account.safe()
	};
};
