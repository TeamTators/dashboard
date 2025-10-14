import { Scouting } from '$lib/server/structs/scouting.js';
import { z } from 'zod';
import terminal from '$lib/server/utils/terminal';
import { decompress as decompressTrace } from 'tatorscout/trace';
import { ServerCode } from 'ts-utils/status';
import { Account } from '$lib/server/structs/account';
import { Err, resolveAll } from 'ts-utils/check';
import { Logs } from '$lib/server/structs/log.js';
import { str } from '$lib/server/utils/env.js';
import { decompress } from '$lib/server/utils/compression';

export const POST = async (event) => {
	terminal.log('Event server request', event.request.url);
	const header = event.request.headers.get('X-API-KEY');

	const res = (message: string, status: ServerCode) =>
		new Response(JSON.stringify({ message }), { status });

	if (String(header) !== str('EVENT_SERVER_API_KEY', true)) {
		return res('Invalid API key', 401);
	}

	const buffer = await event.request.arrayBuffer();
    const body = JSON.parse(decompress(Buffer.from(buffer)));

	const parsed = z
		.object({
			trace: z.string().transform(decompressTrace),
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
		.safeParse(body);

	if (!parsed.success) {
		terminal.warn('Invalid request body', parsed.error.message);
		return res('Invalid request body: ' + parsed.error.message, 400);
	}

	const {
		trace,
		eventKey,
		match,
		team,
		compLevel,
		flipX,
		flipY,
		checks,
		comments,
		scout,
		prescouting,
		practice,
		alliance,
		group,
		remote,
		sliders
	} = parsed.data;

	const year = Number(/(\d+)/.exec(eventKey)?.[1]);

	let accountId = '';

	const account = await Account.Account.fromProperty('username', scout, {
		type: 'single'
	});
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
		return res('Internal server error', 500);
	}
	if (exists.value) {
		matchScoutingId = exists.value.id;
		const update = await exists.value.update({
			scoutId: scout,
			scoutGroup: group,
			prescouting,
			remote,
			trace: JSON.stringify(trace),
			checks: JSON.stringify(checks),
			alliance: alliance ? alliance : 'unknown',
			year
		});
		if (update.isErr()) {
			terminal.error('Error updating match scouting', update.error);
			return res('Internal server error', 500);
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
			trace: JSON.stringify(trace),
			checks: JSON.stringify(checks),
			scoutUsername: scout,
			alliance: alliance ? alliance : 'unknown',
			year,
			sliders: JSON.stringify(sliders)
		});
		if (create.isErr()) {
			terminal.error('Error creating match scouting', create.error);
			return res('Internal server error', 500);
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
		return res('Internal server error', 500);
	}

	return res('Success', 200);
};
