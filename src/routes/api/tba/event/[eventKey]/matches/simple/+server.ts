/**
 * @fileoverview API endpoint for reading and updating event matches.
 * @description
 * Supports GET for TBA match list and POST for custom match updates.
 */

import * as TBA from '$lib/server/utils/tba';
import terminal from '$lib/server/utils/terminal.js';
import { fail, json } from '@sveltejs/kit';
import { ServerCode } from 'ts-utils/status';
import { z } from 'zod';
import { type TBAMatch } from 'tatorscout/tba';

/**
 * Returns the simplified match list for an event.
 * @param event - SvelteKit request event.
 * @returns A JSON response with match data.
 */
export const GET = async (event) => {
	const force = event.url.searchParams.get('force') === 'true';
	const e = await TBA.Event.getEvent(event.params.eventKey);
	if (e.isErr()) {
		terminal.error(e.error);
		throw fail(ServerCode.internalServerError);
	}

	const matches = await e.value.getMatches(force);
	if (matches.isErr()) {
		terminal.error(matches.error);
		throw fail(ServerCode.internalServerError);
	}

	return new Response(JSON.stringify(matches.value.map((m) => m.tba)), {
		headers: {
			'Content-Type': 'application/json'
		},
		status: ServerCode.ok
	});
};

/**
 * Replaces the match list for a custom event.
 * @param event - SvelteKit request event.
 * @returns A JSON response indicating success or failure.
 */
export const POST = async (event) => {
	if (!event.locals.account) {
		return json(
			{
				success: false,
				message: 'You must be signed in to create an event.'
			},
			{ status: ServerCode.unauthorized }
		);
	}

	const { eventKey } = event.params;
	const e = await TBA.Event.getEvent(eventKey);
	if (e.isErr()) {
		return json(
			{
				success: false,
				message: 'Event not found.'
			},
			{ status: ServerCode.notFound }
		);
	}

	const data = await event.request.json();
	const parsed = z
		.array(
			z.object({
				number: z.number(),
				compLevel: z.string(),
				red: z.tuple([z.number(), z.number(), z.number()]),
				blue: z.tuple([z.number(), z.number(), z.number()]),
				time: z.number()
			})
		)
		.safeParse(data);

	if (!parsed.success) {
		terminal.error('Invalid event data:', parsed.error);
		return json(
			{
				success: false,
				message: 'Invalid event data.'
			},
			{ status: ServerCode.badRequest }
		);
	}

	const matches: TBAMatch[] = parsed.data.map((m) => ({
		key: `${eventKey}_${m.compLevel}${m.number}`,
		comp_level: m.compLevel,
		set_number: m.number,
		match_number: m.number,
		alliances: {
			red: {
				score: 0,
				team_keys: [`frc${m.red[0]}`, `frc${m.red[1]}`, `frc${m.red[2]}`]
			},
			blue: {
				score: 0,
				team_keys: [`frc${m.blue[0]}`, `frc${m.blue[1]}`, `frc${m.blue[2]}`]
			}
		},
		event_key: eventKey,
		time: m.time,
		predicted_time: m.time,
		actual_time: m.time,
		score_breakdown: {}
	}));

	const result = await e.value.setMatches(matches);
	if (result.isErr()) {
		terminal.error(result.error);
		return json(
			{
				success: false,
				message: 'Failed to set matches.'
			},
			{ status: ServerCode.internalServerError }
		);
	}
	return json(
		{
			success: true,
			message: 'Matches set successfully.'
		},
		{ status: ServerCode.ok }
	);
};
