import { Struct, type DataArr, type StructData } from 'drizzle-struct/front-end';
import { sse } from '../utils/sse';
import { browser } from '$app/environment';

export namespace Potato {
	export const Friend = new Struct({
		name: 'potato_friend',
		structure: {
			account: 'string',
			level: 'number',
			name: 'string',
			lastClicked: 'string',

			icon: 'string',
			color: 'string',
			background: 'string',

			attack: 'number',
			defense: 'number',
			speed: 'number',
			health: 'number',
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
		sprout: 100,
		baby: 250,
		kid: 500,
		teen: 750,
		adult: 1_000,
		elder: 1_250,
		wizard: 1_500,
		ascending: 2_000,
		god: 2_500,
		timeTraveler: 3_000
	};

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

	export const giveLevels = (accountId: string, levels: number) => {
		return Friend.call('give-levels', { accountId, levels });
	};

	export const renameYourPotato = (name: string) => {
		return Friend.call('rename', { name });
	};

	export const chooseYourIcon = (icon: string) => {
		return Friend.call('change-icon', { icon });
	};
}
