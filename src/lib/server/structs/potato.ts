import { integer, text } from 'drizzle-orm/pg-core';
import { Struct } from 'drizzle-struct/back-end';
import { Account } from './account';
import { attemptAsync } from 'ts-utils/check';
import { Scouting } from './scouting';
import { FIRST } from './FIRST';
import { eq } from 'drizzle-orm';
import { createEntitlement } from '../utils/entitlements';
import { z } from 'zod';
import terminal from '../utils/terminal';
import { Permissions } from './permissions';
import { Universes } from './universe';

export namespace Potato {
	export const LevelUpMap = {
		scouting: 10,
		prescouting: 5,
		remote: 5,
		rescout: 10,
		pit: 1,
		teamPicture: 5
	};

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
		kid: 1_000,
		teen: 2_122,
		adult: 5_000,
		elder: 8_000
	};

	export const Icons = {
		...Levels,
		wizard: 8_500,
		ascending: 9_000,
		god: 9_500,
		timeTraveler: 10_000,
	}


	const getPhase = (level: number) => {
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

	export const Friend = new Struct({
		name: 'potato_friend',
		structure: {
			account: text('account').notNull().unique(),
			level: integer('level').notNull(),
			name: text('name').notNull(),
			lastClicked: text('last_clicked').notNull(),
			icon: text('preffered_icon').notNull().default(''),
			color: text('preffered_color').notNull().default(''),
			background: text('preffered_background').notNull().default(''),

			attack: integer('attack').notNull().default(0),
			defense: integer('defense').notNull().default(0),
			speed: integer('speed').notNull().default(0),
			health: integer('health').notNull().default(0),
			mana: integer('mana').notNull().default(0),
		},
		generators: {
			universe: () => '2122'
		}
	});
	const randomStats = (level: number) => {
		const stats = ["attack", "defense", "speed", "health", "mana"];
		let values = Array(stats.length).fill(0);
	
		// Generate random weights
		const weights = stats.map(() => Math.random());
		const weightSum = weights.reduce((sum, w) => sum + w, 0);
	
		// Distribute points based on weights
		values = weights.map(w => Math.floor((w / weightSum) * level));
	
		// Adjust any rounding errors to ensure exact total
		const finalSum = values.reduce((sum, v) => sum + v, 0);
		let diff = level - finalSum;
	
		// Distribute the difference randomly
		while (diff !== 0) {
			const index = Math.floor(Math.random() * stats.length);
			if (diff > 0) {
				values[index]++;
				diff--;
			} else if (values[index] > 0) {
				values[index]--;
				diff++;
			}
		}
	
		return Object.fromEntries(stats.map((stat, i) => [stat, values[i]]));
	};
	
	

	export const Log = new Struct({
		name: 'potato_log',
		structure: {
			potato: text('potato').notNull(),
			amount: integer('amount').notNull(),
			reason: text('reason').notNull(),
		},
	});

	Friend.callListen('give-levels', async (event, data) => {
		if (!event.locals.account) {
			return {
				success: false,
				message: 'Unauthorized'
			}
		}

		const universe = (await Universes.Universe.fromId('2122')).unwrap();
		if (!universe) {
			return {
				success: false,
				message: 'Universe not found'
			}
		}

		const roles = (await Permissions.getUniverseAccountRoles(event.locals.account, universe)).unwrap();
		if (!Permissions.isEntitled(roles, 'edit-potato-level')) {
			return {
				success: false,
				message: 'Unauthorized'
			}
		}

		const parsed = z.object({
			accountId: z.string(),
			levels: z.number().int(),
		}).safeParse(data);

		if (!parsed.success) {
			terminal.error('Invalid data recieved', parsed.error);
			return {
				success: false,
				message: 'Invalid data recieved'
			}
		}

		const potato = (await getPotato(parsed.data.accountId)).unwrap();
		(await giveLevels(potato, parsed.data.levels, `Manually given levels by ${event.locals.account.data.username}`)).unwrap();

		return {
			success: true,
		}
	});

	Friend.callListen('rename', async (event, data) => {
		if (!event.locals.account) {
			return {
				success: false,
				message: 'Unauthorized'
			}
		}

		const potato = (await getPotato(event.locals.account.id)).unwrap();
		if (potato.data.level < 2122) {
			return {
				success: false,
				message: `${potato.data.name} is not old enough to change their name`
			}
		}

		const parsed = z.object({
			name: z.string(),
		}).safeParse(data);

		if (!parsed.success) {
			terminal.error('Invalid data recieved', parsed.error);
			return {
				success: false,
				message: 'Invalid data recieved'
			}
		}

		(await potato.update({ name: parsed.data.name })).unwrap();

		return {
			success: true,
		}
	});

	Friend.callListen('change-icon', async (event, data) => {
		if (!event.locals.account) {
			return {
				success: false,
				message: 'Unauthorized'
			}
		}

		const potato = (await getPotato(event.locals.account.id)).unwrap();
		if (potato.data.level < Levels.elder) {
			return {
				success: false,
				message: `${potato.data.name} is not old enough to choose their profession`
			}
		}

		const parsed = z.object({
			icon: z.string(),
		}).safeParse(data);

		if (!parsed.success) {
			terminal.error('Invalid data recieved', parsed.error);
			return {
				success: false,
				message: 'Invalid data recieved'
			}
		}

		if (!Object.keys(Icons).includes(parsed.data.icon)) {
			return {
				success: false,
				message: 'Invalid icon',
			}
		}

		(await potato.update({ icon: parsed.data.icon })).unwrap();

		return {
			success: true,
		}
	});

	export type FriendData = typeof Friend.sample;

	const giveLevels = (potato: FriendData, levels: number, reason: string) => {
		return attemptAsync(async () => {
			const currentPhase = getPhase(potato.data.level);
			const newLevel = potato.data.level + levels;
			const nowPhase = getPhase(newLevel);
			if (currentPhase !== nowPhase) {
				Account.sendAccountNotif(potato.data.account, {
					severity: 'success',
					title: 'Your potato has reached a new phase',
					message: `Your potato is now a ${nowPhase} (${Levels[nowPhase]})`,
					icon: '',
					link: ''
				});
			}

			(
				await potato.update({
					level: newLevel,
					lastClicked: levels === 1 ? new Date().toISOString() : potato.data.lastClicked,
					...randomStats(newLevel),
				})
			).unwrap();

			return (
				await Log.new({
					potato: potato.data.account,
					amount: levels,
					reason
				})
			).unwrap();
		});
	};

	Scouting.MatchScouting.on('create', async (s) => {
		const p = await getPotato(s.data.scoutId);
		if (p.isErr()) return;

		let levels = LevelUpMap.scouting;

		// It won't ever be both, but this handles all cases
		if (s.data.prescouting) levels += LevelUpMap.prescouting;
		if (s.data.remote) levels += LevelUpMap.remote;

		const vh = await s.getVersions();
		if (vh.isErr()) return console.error(vh.error);
		if (vh.value.length) levels += LevelUpMap.rescout;

		giveLevels(p.value, levels, 'Scouted a match');
	});

	Scouting.PIT.Answers.on('create', async (a) => {
		const p = await getPotato(a.data.accountId);
		if (p.isErr()) return;

		giveLevels(p.value, LevelUpMap.pit, 'Pit Scouting');
	});

	FIRST.TeamPictures.on('create', async (pic) => {
		const p = await getPotato(pic.data.accountId);
		if (p.isErr()) return;

		giveLevels(p.value, LevelUpMap.teamPicture, 'Uploaded a team picture');
	});

	export const getPotato = (accountId: string) => {
		return attemptAsync(async () => {
			const p = (
				await Friend.fromProperty('account', accountId, {
					type: 'single'
				})
			).unwrap();
			if (p) return p;

			const a = (await Account.Account.fromId(accountId)).unwrap();
			if (!a) throw new Error('Account not found');

			return (
				await Friend.new({
					account: accountId,
					level: 0,
					name: a.data.username + "'s Potato",
					lastClicked: new Date().toISOString(),
					icon: '',
					color: '',
					background: '',
					attack: 0,
					defense: 0,
					speed: 0,
					health: 0,
					mana: 0,
				})
			).unwrap();
		});
	};

	export const getRankings = async () => {
		return attemptAsync(async () => {
			return Friend.database
				.select({
					username: Account.Account.table.username,
					level: Friend.table.level,
					name: Friend.table.name
				})
				.from(Friend.table)
				.orderBy(Friend.table.level)
				.innerJoin(Account.Account.table, eq(Friend.table.account, Account.Account.table.id))
				.then((r) => r.reverse());
		});
	};

	createEntitlement({
		name: 'view-potatoes',
		structs: [Friend],
		group: 'Potatoes',
		permissions: ['potato_friend:read:*']
	});

	createEntitlement({
		name: 'edit-potato-level',
		structs: [Friend],
		group: 'Potatoes',
		permissions: ['potato_friend:update:level']
	});
}

export const _potato = Potato.Friend.table;
export const _potatoLog = Potato.Log.table;