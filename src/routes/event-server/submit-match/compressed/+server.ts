import { Scouting } from '$lib/server/structs/scouting.js';
import { z } from 'zod';
import terminal from '$lib/server/utils/terminal';
import { Trace } from 'tatorscout/trace';
import { ServerCode } from 'ts-utils/status';
import { Account } from '$lib/server/structs/account';
import { Err, resolveAll } from 'ts-utils/check';
import { Logs } from '$lib/server/structs/log.js';
import { str } from '$lib/server/utils/env.js';
import { decompress } from '$lib/server/utils/compression';
import type { RequestEvent } from './$types';

export const POST = async (event: RequestEvent) => {
	terminal.log('Event server request', event.request.url);
	const header = event.request.headers.get('X-API-KEY');

	const res = (success: boolean, message: string, status: ServerCode) =>
		new Response(JSON.stringify({ success, message }), { status });

	if (
		String(header) !== str('EVENT_SERVER_API_KEY', true) &&
		!event.locals.account?.data.verified
	) {
		return res(false, 'Invalid API key', 401);
	}

	const body = await event.request.arrayBuffer();

	const parsed = z
		.object({
			trace: z.string(),
			eventKey: z.string(),
			match: z.number().int(),
			team: z.number().int(),
			compLevel: z.enum(['pr', 'qm', 'qf', 'sf', 'f']),
			flipX: z.boolean(),
			flipY: z.boolean(),
			checks: z.array(z.string()),
			comments: z.record(z.string()),
			scout: z.string(),
			prescouting: z.boolean(),
			practice: z.boolean(),
			alliance: z.union([z.literal('red'), z.literal('blue'), z.literal(null)]),
			group: z.number().int(),
			remote: z.boolean(),
			sliders: z.record(
				z.string(),
				z.object({
					value: z.number().int().min(0).max(5),
					text: z.string(),
					color: z.string()
				})
			)
		})
		.safeParse(decompress(Buffer.from(body)).unwrap());

	if (!parsed.success) {
		terminal.warn('Invalid request body', parsed.error.message);
		return res(false, 'Invalid request body: ' + parsed.error.message, 400);
	}

	const {
		trace,
		eventKey,
		match,
		team,
		compLevel,
		// flipX,
		// flipY,
		checks,
		comments,
		scout,
		prescouting,
		// practice,
		alliance,
		group,
		remote,
		sliders
	} = parsed.data;

	const year = Number(/(\d+)/.exec(eventKey)?.[1]);

	let accountId = '';

	const account = await Account.Account.get(
		{ username: scout },
		{
			type: 'single'
		}
	);
	if (account.isOk() && account.value) {
		accountId = account.value.id;
	}

	const exists = await Scouting.getMatchScouting({
		eventKey,
		match,
		team,
		compLevel
	});

	let matchScoutingId: string;

	if (exists.isErr()) {
		terminal.error('Error getting match scouting', exists.error);
		return res(false, 'Internal server error', 500);
	}
	if (exists.value) {
		if (
			exists.value.data.trace === trace &&
			exists.value.data.checks === JSON.stringify(checks) &&
			exists.value.data.sliders === JSON.stringify(sliders) &&
			exists.value.data.scoutGroup === group &&
			exists.value.data.remote === remote &&
			exists.value.data.prescouting === prescouting &&
			exists.value.data.alliance === (alliance ? alliance : 'unknown')
		) {
			return res(true, 'No changes detected', 200);
		}
		matchScoutingId = exists.value.id;
		const update = await exists.value.update({
			scoutId: scout,
			scoutGroup: group,
			prescouting,
			remote,
			trace: Trace.parse(trace).unwrap().serialize(),
			checks: JSON.stringify(checks),
			alliance: alliance ? alliance : 'unknown',
			year,
			sliders: JSON.stringify(sliders)
		});
		if (update.isErr()) {
			terminal.error('Error updating match scouting', update.error);
			return res(false, 'Internal server error', 500);
		} else {
			Logs.log({
				struct: Scouting.MatchScouting.name,
				dataId: matchScoutingId,
				accountId,
				type: 'update',
				message: 'Updated match scouting'
			});
		}
	} else {
		const create = await Scouting.MatchScouting.new({
			eventKey,
			matchNumber: match,
			compLevel,
			team,
			scoutId: accountId,
			prescouting,
			remote,
			scoutGroup: group,
			trace: Trace.parse(trace).unwrap().serialize(),
			checks: JSON.stringify(checks),
			scoutUsername: scout,
			alliance: alliance ? alliance : 'unknown',
			year,
			sliders: JSON.stringify(sliders)
		});
		if (create.isErr()) {
			terminal.error('Error creating match scouting', create.error);
			return res(false, 'Internal server error', 500);
		} else {
			Logs.log({
				struct: Scouting.MatchScouting.name,
				dataId: create.value.id,
				accountId,
				type: 'create',
				message: 'Created match scouting'
			});
		}
		matchScoutingId = create.value.id;
	}

	const commentRes = resolveAll(
		await Promise.all(
			Object.entries(comments).map(([key, value]) =>
				Scouting.TeamComments.new({
					accountId,
					team,
					comment: value,
					type: key,
					eventKey,
					matchScoutingId,
					scoutUsername: scout
				}).then(async (res) => {
					if (res.isOk()) {
						return Logs.log({
							struct: Scouting.TeamComments.name,
							dataId: res.value.id,
							accountId,
							type: 'create',
							message: 'Created team comment'
						});
					} else {
						terminal.error('Error creating comments', res.error);
						return new Err(res.error);
					}
				})
			)
		)
	);

	if (commentRes.isErr()) {
		terminal.error('Error creating comments', commentRes.error);
		return res(false, 'Internal server error', 500);
	}

	return res(true, 'Success', 200);
};
