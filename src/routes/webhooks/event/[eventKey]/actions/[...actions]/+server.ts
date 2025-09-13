import { actionSummary } from '$lib/server/utils/action-summary.js';
import { fail } from '@sveltejs/kit';
import { auth } from '$lib/server/utils/google-summary';
import type { Action2025, Action } from 'tatorscout/trace';
import { ServerCode } from 'ts-utils/status';

export const GET = async (event) => {
	// auth(event);
	const actions = event.params.actions
		.split('/')
		.filter((v, i, a) => a.indexOf(v) === i) as Action[];

	const data = await actionSummary(event.params.eventKey, actions);
	if (data.isErr())
		throw fail(ServerCode.internalServerError, {
			error: data.error.message
		});

	const res = await data.value.serialize();

	if (res.isErr())
		throw fail(ServerCode.internalServerError, {
			error: res.error.message
		});

	return new Response(
		JSON.stringify({
			actionSummary: res.value
		}),
		{
			status: 200,
			headers: {
				'Content-Type': 'application/json'
			}
		}
	);
};
