/**
 * @fileoverview Remote procedures for potato actions.
 *
 * @description
 * Exposes commands for giving levels, renaming a potato, and changing icons.
 */
import { command } from '$app/server';
import { z } from 'zod';
import { getAccount } from './index.remote';
import { error } from '@sveltejs/kit';
import { Potato } from '../server/structs/potato';

/**
 * Grant levels to a specific account's potato.
 *
 * @returns {ReturnType<typeof command>} Remote command handler.
 */
export const giveLevels = command(
	z.object({
		accountId: z.string(),
		levels: z.number().int()
	}),
	async (data) => {
		const account = await getAccount();
		if (!account) {
			throw error(401, 'Unauthorized');
		}

		const potato = (await Potato.getPotato(data.accountId)).unwrap();
		(
			await Potato.giveLevels(
				potato,
				data.levels,
				`Manually given levels by ${account.data.username}`
			)
		).unwrap();

		return {
			success: true,
			message: 'Levels given successfully'
		};
	}
);

/**
 * Rename the current user's potato (requires level gate).
 *
 * @returns {ReturnType<typeof command>} Remote command handler.
 */
export const rename = command(
	z.object({
		name: z.string()
	}),
	async (data) => {
		const account = await getAccount();
		if (!account) {
			throw error(401, 'Unauthorized');
		}

		const potato = (await Potato.getPotato(account.id)).unwrap();

		if (potato.data.level < 987) {
			return {
				success: false,
				message: `${potato.data.name} is not old enough to be renamed`
			};
		}

		(await potato.update({ name: data.name })).unwrap();

		return {
			success: true,
			message: 'Potato renamed successfully'
		};
	}
);

/**
 * Change the current user's potato icon (requires level gate).
 *
 * @returns {ReturnType<typeof command>} Remote command handler.
 */
export const changeIcon = command(
	z.object({
		icon: z.string()
	}),
	async ({ icon }) => {
		const account = await getAccount();

		if (!account) {
			throw error(401, 'Unauthorized');
		}

		const potato = await Potato.getPotato(account.id).unwrap();
		if (potato.data.level < 987) {
			return {
				success: false,
				message: `${potato.data.name} is not old enough to choose their profession`
			};
		}
		if (!Object.keys(Potato.Levels).includes(icon)) {
			return {
				success: false,
				message: 'Invalid icon'
			};
		}

		await potato.update({ icon }).unwrap();

		return {
			success: true
		};
	}
);
