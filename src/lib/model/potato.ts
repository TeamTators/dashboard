/**
 * @fileoverview Potato Struct models and helper utilities.
 *
 * @description
 * Defines the potato friend Struct, level thresholds, and helpers for phase lookup and
 * server-side actions such as renaming or changing icons.
 */
import { type DataArr } from '$lib/services/struct/data-arr';
import { Struct } from '$lib/services/struct';
import { StructData } from '$lib/services/struct';
import { sse } from '../services/sse';
import { browser } from '$app/environment';
import * as remote from '$lib/remotes/potato.remote';
import { attemptAsync } from 'ts-utils';

export namespace Potato {
	export const Friend = new Struct({
		name: 'potato_friend',
		structure: {
			/** Account id that owns the potato. */
			account: 'string',
			/** Current potato level. */
			level: 'number',
			/** Custom potato name. */
			name: 'string',
			/** ISO timestamp for last click. */
			lastClicked: 'string',

			/** Custom icon identifier. */
			icon: 'string',
			/** Primary color name or hex. */
			color: 'string',
			/** Background color name or hex. */
			background: 'string',

			/** Attack stat value. */
			attack: 'number',
			/** Defense stat value. */
			defense: 'number',
			/** Speed stat value. */
			speed: 'number',
			/** Health stat value. */
			health: 'number',
			/** Mana stat value. */
			mana: 'number'
		},
		socket: sse,
		browser
	});

	export type FriendData = StructData<typeof Friend.data.structure>;
	export type FriendArr = DataArr<typeof Friend.data.structure>;

	export const Levels = {
		// seed: 0,
		// sprout: 100,
		// plant: 250,
		// mature: 500,
		// flower: 1_000,
		// sentient: 1_500,
		// intelligent: 2122,
		// divine: 3_000,
		// omnipotent: 4_000,
		// omnipresent: 5_000,
		// god: 7_500,
		// tator: 10_000
		seed: 0,
		sprout: 192,
		baby: 254,
		kid: 500,
		teen: 750,
		adult: 987,
		elder: 1_250,
		wizard: 1_569,
		ascending: 1_891,
		god: 2_122,
		timeTraveler: 2_250
	};

	/**
	 * Return the next phase key based on the current level.
	 *
	 * @returns {keyof typeof Levels} Next phase key.
	 *
	 * @example
	 * ```ts
	 * const next = Potato.getNextPhase(500);
	 * ```
	 */
	export const getNextPhase = (level: number): keyof typeof Levels => {
		switch (true) {
			case level < Levels.sprout:
				return 'sprout';
			case level < Levels.baby:
				return 'baby';
			case level < Levels.kid:
				return 'kid';
			case level < Levels.teen:
				return 'teen';
			case level < Levels.adult:
				return 'adult';
			case level < Levels.elder:
				return 'elder';
			default:
				return 'elder';
		}
	};

	/**
	 * Return the current phase key based on the current level.
	 *
	 * @returns {string} Current phase key.
	 *
	 * @example
	 * ```ts
	 * const phase = Potato.getPhase(750);
	 * ```
	 */
	export const getPhase = (level: number) => {
		switch (true) {
			// case level < Levels.sprout:
			// 	return 'seed';
			// case level < Levels.plant:
			// 	return 'sprout';
			// case level < Levels.mature:
			// 	return 'plant';
			// case level < Levels.flower:
			// 	return 'mature';
			// case level < Levels.sentient:
			// 	return 'flower';
			// case level < Levels.intelligent:
			// 	return 'sentient';
			// case level < Levels.divine:
			// 	return 'intelligent';
			// case level < Levels.omnipotent:
			// 	return 'divine';
			// case level < Levels.omnipresent:
			// 	return 'omnipotent';
			// case level < Levels.god:
			// 	return 'omnipresent';
			// case level < Levels.tator:
			// 	return 'god';
			case level < Levels.sprout:
				return 'seed';
			case level < Levels.baby:
				return 'sprout';
			case level < Levels.kid:
				return 'baby';
			case level < Levels.teen:
				return 'kid';
			case level < Levels.adult:
				return 'teen';
			case level < Levels.elder:
				return 'adult';
			default:
				return 'elder';
		}
	};

	/**
	 * Grant levels to a potato account.
	 *
	 * @returns {ReturnType<typeof attemptAsync>} Result wrapper for the command.
	 *
	 * @example
	 * ```ts
	 * await Potato.giveLevels('account-id', 10);
	 * ```
	 */
	export const giveLevels = (accountId: string, levels: number) => {
		return attemptAsync(async () => {
			return remote.giveLevels({ accountId, levels });
		});
	};

	/**
	 * Rename the current user's potato.
	 *
	 * @returns {ReturnType<typeof attemptAsync>} Result wrapper for the command.
	 *
	 * @example
	 * ```ts
	 * await Potato.renameYourPotato('Spuddy');
	 * ```
	 */
	export const renameYourPotato = (name: string) => {
		return attemptAsync(async () => {
			return remote.rename({ name });
		});
	};

	/**
	 * Change the current user's potato icon.
	 *
	 * @returns {ReturnType<typeof attemptAsync>} Result wrapper for the command.
	 *
	 * @example
	 * ```ts
	 * await Potato.chooseYourIcon('wizard');
	 * ```
	 */
	export const chooseYourIcon = (icon: string) => {
		return attemptAsync(async () => {
			return remote.changeIcon({ icon });
		});
	};
}
