import { boolean } from 'drizzle-orm/pg-core';
import { integer } from 'drizzle-orm/pg-core';
import { text } from 'drizzle-orm/pg-core';
import { Struct } from 'drizzle-struct/back-end';
import { createEntitlement } from '../utils/entitlements';
import { attemptAsync } from 'ts-utils/check';
import { DB } from '../db';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

export namespace Scouting {
	export const MatchScouting = new Struct({
		name: 'match_scouting',
		structure: {
			// matchId: text('match_id').notNull(),
			eventKey: text('event_key').notNull(),
			matchNumber: integer('match_number').notNull(),
			compLevel: text('comp_level').notNull(),
			team: integer('team').notNull(),
			scoutId: text('scout_id').notNull(),
			scoutGroup: integer('scout_group').notNull(),
			prescouting: boolean('prescouting').notNull(),
			remote: boolean('remote').notNull(),
			trace: text('trace').notNull(),
			checks: text('checks').notNull()
		},
		versionHistory: {
			type: 'versions',
			amount: 3
		},
		generators: {
			universe: () => '2122',
		},
		validators: {
			trace: (trace) => typeof trace === 'string' && z.array(z.tuple([z.number(), z.number(), z.number(), z.string()])).safeParse(JSON.parse(trace)).success,
			checks: (checks) => typeof checks === 'string' && z.array(z.string()).safeParse(JSON.parse(checks)).success
		}
	});

	export const getMatchScouting = (data: {
		eventKey: string;
		match: number;
		team: number;
		compLevel: string;
	}) => {
		return attemptAsync(async () => {
			const [res] = await DB
				.select().from(MatchScouting.table)
				.where(and(
					eq(MatchScouting.table.eventKey, data.eventKey),
					eq(MatchScouting.table.matchNumber, data.match),
					eq(MatchScouting.table.team, data.team),
					eq(MatchScouting.table.compLevel, data.compLevel)
				));

			if (!res) return undefined;
			return MatchScouting.Generator(res);
		});
	}

	export const TeamComments = new Struct({
		name: 'team_comments',
		structure: {
			matchScoutingId: text('match_Scouting_id').notNull(),
			accountId: text('account_id').notNull(),
			team: integer('team').notNull(),
			comment: text('comment').notNull(),
			type: text('type').notNull(),
			eventKey: text('event_key').notNull()
		},
		versionHistory: {
			type: 'versions',
			amount: 3
		},
		generators: {
			universe: () => '2122'
		}
	});

	createEntitlement({
		name: 'view-scouting',
		structs: [MatchScouting, TeamComments],
		permissions: ['match_scouting:read:*', 'team_comments:read:*'],
		group: 'Scouting'
	});

	export namespace PIT {
		export const Sections = new Struct({
			name: 'pit_sections',
			structure: {
				name: text('name').notNull(),
				multiple: boolean('multiple').notNull(),
				accountId: text('account_id').notNull()
			},
			versionHistory: {
				type: 'versions',
				amount: 3
			},
			generators: {
				universe: () => '2122'
			}
		});

		export const Groups = new Struct({
			name: 'pit_groups',
			structure: {
				eventKey: text('event_key').notNull(),
				sectionId: text('section_id').notNull(),
				name: text('name').notNull(),
				accountId: text('account_id').notNull()
			},
			versionHistory: {
				type: 'versions',
				amount: 3
			},
			generators: {
				universe: () => '2122'
			}
		});

		export const Questions = new Struct({
			name: 'pit_questions',
			structure: {
				question: text('question').notNull(),
				groupId: text('group_id').notNull(),
				key: text('key').notNull(),
				description: text('description').notNull(),
				type: text('type').notNull(), // boolean/number/text/textarea/etc.
				accountId: text('account_id').notNull(),
				options: text('options').notNull() // JSON string[] for checkboxes/radios
			},
			versionHistory: {
				type: 'versions',
				amount: 3
			},
			generators: {
				universe: () => '2122'
			}
		});

		export const Answers = new Struct({
			name: 'pit_answers',
			structure: {
				questionId: text('question_id').notNull(),
				answer: text('answer').notNull(),
				team: integer('team').notNull(),
				accountId: text('account_id').notNull()
			},
			versionHistory: {
				type: 'versions',
				amount: 3
			},
			generators: {
				universe: () => '2122'
			}
		});

		createEntitlement({
			name: 'view-pit-scouting',
			structs: [Sections, Groups, Questions, Answers],
			permissions: [
				'pit_sections:read:*',
				'pit_groups:read:*',
				'pit_questions:read:*',
				'pit_answers:read:*'
			],
			group: 'Scouting'
		});
	}
}

export const _scoutingMatchScoutingTable = Scouting.MatchScouting.table;
export const _scoutingTeamCommentsTable = Scouting.TeamComments.table;
export const _scoutingPitSectionsTable = Scouting.PIT.Sections.table;
export const _scoutingPitGroupsTable = Scouting.PIT.Groups.table;
export const _scoutingPitQuestionsTable = Scouting.PIT.Questions.table;
export const _scoutingPitAnswersTable = Scouting.PIT.Answers.table;

export const _scoutingMatchScoutingVersionTable = Scouting.MatchScouting.versionTable;
export const _scoutingTeamCommentsVersionTable = Scouting.TeamComments.versionTable;
export const _scoutingPitSectionsVersionTable = Scouting.PIT.Sections.versionTable;
export const _scoutingPitGroupsVersionTable = Scouting.PIT.Groups.versionTable;
export const _scoutingPitQuestionsVersionTable = Scouting.PIT.Questions.versionTable;
export const _scoutingPitAnswersVersionTable = Scouting.PIT.Answers.versionTable;
