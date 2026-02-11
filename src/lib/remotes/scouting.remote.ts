/**
 * @fileoverview Remote procedures for scouting administration.
 *
 * @description
 * Exposes admin-only commands and queries for pit-scouting templates and practice archiving.
 */
import { command, query } from '$app/server';
import z from 'zod';
import { getAccount } from './index.remote';
import { Account } from '$lib/server/structs/account';
import { Scouting } from '$lib/server/structs/scouting';
import { error } from '@sveltejs/kit';
import terminal from '$lib/server/utils/terminal';

/**
 * Archive or unarchive practice matches for an event.
 *
 * @returns {ReturnType<typeof command>} Remote command handler.
 */
export const setPracticeArchive = command(
	z.object({
		eventKey: z.string(),
		archive: z.boolean()
	}),
	async ({ eventKey, archive }) => {
		const account = await getAccount();
		if (!account) return error(401, 'Unauthorized');
		if (!(await Account.isAdmin(account).unwrap())) {
			return error(403, 'Forbidden');
		}

		Scouting.MatchScouting.get(
			{ eventKey: eventKey },
			{
				type: 'stream'
			}
		).pipe((d) => {
			if (!['qm', 'qf', 'sf', 'f'].includes(d.data.compLevel)) d.setArchive(archive);
		});

		return {
			success: true
		};
	}
);

/**
 * Fetch pit-scouting answers for a group filtered by question ids.
 *
 * @returns {ReturnType<typeof query>} Remote query handler.
 */
export const pitAnswersFromGroup = query(
	z.object({
		questions: z.array(z.string()),
		group: z.string()
	}),
	async ({ questions, group }) => {
		const account = await getAccount();
		if (!account) return error(401, 'Unauthorized');
		if (!(await Account.isAdmin(account).unwrap())) {
			return error(403, 'Forbidden');
		}
		const g = (await Scouting.PIT.Groups.fromId(group)).unwrap();
		if (!g) return error(404, 'Group not found');
		return await Scouting.PIT.getAnswersFromGroup(g)
			.unwrap()
			.then((answers) =>
				answers.filter((a) => questions.includes(a.data.questionId)).map((a) => a.safe())
			);
	}
);

/**
 * Generate a pit-scouting template for the given event.
 *
 * @returns {ReturnType<typeof command>} Remote command handler.
 */
export const generateEventPitscoutingTemplate = command(
	z.object({
		eventKey: z.string()
	}),
	async ({ eventKey }) => {
		const account = await getAccount();
		if (!account) return error(401, 'Unauthorized');
		if (!(await Account.isAdmin(account).unwrap())) {
			return error(403, 'Forbidden');
		}
		const res = await Scouting.PIT.generateBoilerplate(eventKey, account.id);

		if (res.isOk()) {
			return {
				success: true
			};
		} else {
			terminal.error(res.error);
			return {
				success: false,
				message: 'Failed to generate'
			};
		}
	}
);

/**
 * Copy pit-scouting templates from one event to another.
 *
 * @returns {ReturnType<typeof command>} Remote command handler.
 */
export const copyPitScoutingFromEvent = command(
	z.object({
		from: z.string(),
		to: z.string()
	}),
	async ({ from, to }) => {
		const account = await getAccount();
		if (!account) {
			throw error(401, 'Unauthorized');
		}
		if (!(await Account.isAdmin(account).unwrap())) {
			throw error(403, 'Forbidden');
		}

		const res = await Scouting.PIT.copyFromEvent(from, to, account.id);
		if (res.isOk()) {
			return {
				success: true
			};
		} else {
			terminal.error(res.error);
			return {
				success: false,
				message: 'Failed to copy'
			};
		}
	}
);
