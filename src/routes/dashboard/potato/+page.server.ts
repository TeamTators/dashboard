import { Potato } from '$lib/server/structs/potato.js';
import { redirect } from '@sveltejs/kit';
import { ServerCode } from 'ts-utils/status';
import { config } from '$lib/server/utils/env';

export const load = async (event) => {
	if (!config.potato.enabled) throw redirect(ServerCode.permanentRedirect, '/');
	const rankings = (await Potato.getRankings()).unwrap();
	const you = rankings.find((r) => r.account.data.username === event.locals.account?.data.username);
	return {
		rankings: rankings.map((r) => ({
			account: r.account.safe(),
			potato: r.potato.safe()
		})),
		you: {
			account: you?.account?.safe(),
			potato: you?.potato.safe()
		}
	};
};
