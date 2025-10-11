import { Potato } from '$lib/server/structs/potato.js';
import { PUBLIC_DO_POTATO } from '$env/static/public';
import { redirect } from '@sveltejs/kit';
import { ServerCode } from 'ts-utils/status';

export const load = async (event) => {
	if (PUBLIC_DO_POTATO !== 'true') throw redirect(ServerCode.permanentRedirect, '/');
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
