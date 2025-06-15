import { boolean } from 'drizzle-orm/pg-core';
import { integer } from 'drizzle-orm/pg-core';
import { text } from 'drizzle-orm/pg-core';
import { Struct, StructStream } from 'drizzle-struct/back-end';
import { createEntitlement } from '../utils/entitlements';
import { z } from 'zod';
import { attemptAsync, resolveAll } from 'ts-utils/check';
import { DB } from '../db';
import { eq, and } from 'drizzle-orm';
import { Session } from './session';
import { Permissions } from './permissions';
import terminal from '../utils/terminal';
import { TraceSchema } from 'tatorscout/trace';
import { Logs } from './log';
import { Account } from './account';

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
			checks: text('checks').notNull(),
			scoutUsername: text('scout_username').notNull(),
			alliance: text('alliance').notNull(),
			year: integer('year').notNull().default(0),
			sliders: text('sliders').notNull().default('{}')
		},
		versionHistory: {
			type: 'versions',
			amount: 3
		},
		generators: {
			universe: () => '2122'
		},
		validators: {
			// trace: (trace) =>
			// 	typeof trace === 'string' && TraceSchema.safeParse(JSON.parse(trace)).success,
			// checks: (checks) =>
			// 	typeof checks === 'string' && z.array(z.string()).safeParse(JSON.parse(checks)).success
		}
	});

	export type MatchScoutingData = typeof MatchScouting.sample;

	MatchScouting.queryListen('from-team', async (event, data) => {
		if (!event.locals.account) return new Error('Not logged in');
		if (!(await Account.isAdmin(event.locals.account)).unwrap()) {
			const roles = (await Permissions.allAccountRoles(event.locals.account)).unwrap();
			if (!(await Permissions.isEntitled(roles, 'view-scouting')).unwrap())
				return new Error('Not entitled');
		}

		const { team, eventKey } = z
			.object({
				team: z.number(),
				eventKey: z.string()
			})
			.parse(data);

		const stream = new StructStream(MatchScouting);

		setTimeout(async () => {
			const matchScouting = await DB.select()
				.from(MatchScouting.table)
				.where(
					and(
						eq(MatchScouting.table.team, team),
						eq(MatchScouting.table.eventKey, eventKey),
						eq(MatchScouting.table.archived, false)
					)
				);

			for (let i = 0; i < matchScouting.length; i++) {
				stream.add(MatchScouting.Generator(matchScouting[i]));
			}

			stream.end();
		});

		return stream;
	});

	MatchScouting.queryListen('archived-matches', async (event, data) => {
		if (!event.locals.account) return new Error('Not logged in');
		if (!(await Account.isAdmin(event.locals.account)).unwrap()) {
			const roles = (await Permissions.allAccountRoles(event.locals.account)).unwrap();
			if (!(await Permissions.isEntitled(roles, 'manage-scouting')).unwrap())
				return new Error('Not entitled');
		}

		const { team, eventKey } = z
			.object({
				team: z.number(),
				eventKey: z.string()
			})
			.parse(data);

		const stream = new StructStream(MatchScouting);

		setTimeout(async () => {
			const matchScouting = await DB.select()
				.from(MatchScouting.table)
				.where(
					and(
						eq(MatchScouting.table.team, team),
						eq(MatchScouting.table.eventKey, eventKey),
						eq(MatchScouting.table.archived, true)
					)
				);

			for (let i = 0; i < matchScouting.length; i++) {
				stream.add(MatchScouting.Generator(matchScouting[i]));
			}

			stream.end();
		});

		return stream;
	});

	MatchScouting.queryListen('pre-scouting', async (event, data) => {
		if (!event.locals.account) return new Error('Not logged in');
		if (!(await Account.isAdmin(event.locals.account)).unwrap()) {
			const roles = (await Permissions.allAccountRoles(event.locals.account)).unwrap();
			if (!(await Permissions.isEntitled(roles, 'view-scouting')).unwrap())
				return new Error('Not entitled');
		}

		const { team, year } = z
			.object({
				team: z.number(),
				year: z.number()
			})
			.parse(data);

		const stream = new StructStream(MatchScouting);

		setTimeout(async () => {
			const matchScouting = await DB.select()
				.from(MatchScouting.table)
				.where(
					and(
						eq(MatchScouting.table.team, team),
						eq(MatchScouting.table.year, year),
						eq(MatchScouting.table.prescouting, true)
					)
				);

			for (let i = 0; i < matchScouting.length; i++) {
				stream.add(MatchScouting.Generator(matchScouting[i]));
			}

			stream.end();
		});

		return stream;
	});

	MatchScouting.callListen('set-practice-archive', async (event, data) => {
		if (!event.locals.account)
			return {
				success: false,
				message: 'Not logged in'
			};
		if (!(await Account.isAdmin(event.locals.account)).unwrap()) {
			const roles = (await Permissions.allAccountRoles(event.locals.account)).unwrap();
			if (!(await Permissions.isEntitled(roles, 'manage-scouting')).unwrap())
				return {
					success: false,
					message: 'Not entitled'
				};
		}

		const parsed = z
			.object({
				eventKey: z.string(),
				archive: z.boolean()
			})
			.safeParse(data);

		if (!parsed.success)
			return {
				success: false,
				message: 'Invalid data'
			};

		const { eventKey, archive } = parsed.data;

		MatchScouting.fromProperty('eventKey', eventKey, {
			type: 'stream'
		}).pipe((d) => {
			if (!['qm', 'qf', 'sf', 'f'].includes(d.data.compLevel)) d.setArchive(archive);
		});

		return {
			success: true
		};
	});

	MatchScouting.on('archive', (match) => {
		TeamComments.fromProperty('matchScoutingId', match.id, {
			type: 'stream'
		}).pipe((d) => d.setArchive(true));
	});

	MatchScouting.on('restore', (match) => {
		TeamComments.fromProperty('matchScoutingId', match.id, {
			type: 'stream',
			includeArchived: true
		}).pipe((d) => d.setArchive(false));
	});

	export const getMatchScouting = (data: {
		eventKey: string;
		match: number;
		team: number;
		compLevel: string;
	}) => {
		return attemptAsync(async () => {
			const [res] = await DB.select()
				.from(MatchScouting.table)
				.where(
					and(
						eq(MatchScouting.table.eventKey, data.eventKey),
						eq(MatchScouting.table.matchNumber, data.match),
						eq(MatchScouting.table.team, data.team),
						eq(MatchScouting.table.compLevel, data.compLevel),
						eq(MatchScouting.table.archived, false)
					)
				);

			if (!res) return undefined;
			return MatchScouting.Generator(res);
		});
	};

	export const getTeamScouting = (team: number, event: string) => {
		return attemptAsync(async () => {
			const res = await DB.select()
				.from(MatchScouting.table)
				.where(
					and(
						eq(MatchScouting.table.team, team),
						eq(MatchScouting.table.eventKey, event),
						eq(MatchScouting.table.archived, false)
					)
				);

			return res.map((r) => MatchScouting.Generator(r));
		});
	};

	export const getTeamPrescouting = (team: number, year: number) => {
		return attemptAsync(async () => {
			const res = await DB.select()
				.from(MatchScouting.table)
				.where(and(eq(MatchScouting.table.team, team), eq(MatchScouting.table.year, year)));

			return res.map((r) => MatchScouting.Generator(r));
		});
	};

	export const getPreScouting = (team: number, year: number) => {
		return attemptAsync(async () => {
			const res = await DB.select()
				.from(MatchScouting.table)
				.where(
					and(
						eq(MatchScouting.table.team, team),
						eq(MatchScouting.table.year, year),
						eq(MatchScouting.table.prescouting, true)
					)
				);

			return res;
		});
	};

	export const getTeamComments = (team: number, event: string) => {
		return attemptAsync(async () => {
			const res = await DB.select()
				.from(TeamComments.table)
				.where(
					and(
						eq(TeamComments.table.team, team),
						eq(TeamComments.table.eventKey, event),
						eq(TeamComments.table.archived, false)
					)
				);

			return res.map((r) => TeamComments.Generator(r));
		});
	};

	export const TeamComments = new Struct({
		name: 'team_comments',
		structure: {
			matchScoutingId: text('match_Scouting_id').notNull(),
			accountId: text('account_id').notNull(),
			team: integer('team').notNull(),
			comment: text('comment').notNull(),
			type: text('type').notNull(),
			eventKey: text('event_key').notNull(),
			scoutUsername: text('scout_username').notNull()
		},
		versionHistory: {
			type: 'versions',
			amount: 3
		},
		generators: {
			universe: () => '2122'
		}
	});

	TeamComments.queryListen('from-event', async (event, data) => {
		if (!event.locals.account) return new Error('Not logged in');
		const roles = (await Permissions.allAccountRoles(event.locals.account)).unwrap();
		if (!(await Permissions.isEntitled(roles, 'view-scouting')).unwrap())
			return new Error('Not entitled');

		const { eventKey, team } = z
			.object({
				eventKey: z.string(),
				team: z.number()
			})
			.parse(data);

		const stream = new StructStream(TeamComments);

		setTimeout(async () => {
			const comments = await DB.select()
				.from(TeamComments.table)
				.where(and(eq(TeamComments.table.eventKey, eventKey), eq(TeamComments.table.team, team)));

			for (let i = 0; i < comments.length; i++) {
				stream.add(TeamComments.Generator(comments[i]));
			}

			stream.end();
		});

		return stream;
	});

	createEntitlement({
		name: 'view-scouting',
		structs: [MatchScouting, TeamComments],
		permissions: ['match_scouting:read:*', 'team_comments:read:*'],
		group: 'Scouting'
	});

	createEntitlement({
		name: 'manage-scouting',
		structs: [MatchScouting, TeamComments],
		permissions: ['match_scouting:*:*', 'team_comments:*:*'],
		group: 'Scouting'
	});

	export namespace PIT {
		export const Sections = new Struct({
			name: 'pit_sections',
			structure: {
				name: text('name').notNull(),
				order: integer('order').notNull(),
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
		export type SectionData = typeof Sections.sample;

		Sections.on('delete', async (data) => {
			Groups.fromProperty('sectionId', data.id, {
				type: 'stream'
			}).pipe((d) => d.delete());
		});

		export const Groups = new Struct({
			name: 'pit_groups',
			structure: {
				sectionId: text('section_id').notNull(),
				name: text('name').notNull(),
				order: integer('order').notNull()
			},
			versionHistory: {
				type: 'versions',
				amount: 3
			},
			generators: {
				universe: () => '2122'
			}
		});

		export type GroupData = typeof Groups.sample;

		Groups.on('delete', async (data) => {
			Questions.fromProperty('groupId', data.id, {
				type: 'stream'
			}).pipe((d) => d.delete());
		});

		export const Questions = new Struct({
			name: 'pit_questions',
			structure: {
				question: text('question').notNull(),
				groupId: text('group_id').notNull(),
				key: text('key').notNull(),
				description: text('description').notNull(),
				type: text('type').notNull(), // boolean/number/text/textarea/etc.
				options: text('options').notNull(), // JSON string[] for checkboxes/radios
				order: integer('order').notNull()
			},
			versionHistory: {
				type: 'versions',
				amount: 3
			},
			generators: {
				universe: () => '2122'
			},
			validators: {
				options: (data) => {
					if (typeof data !== 'string') return false;
					return z.array(z.string()).safeParse(JSON.parse(data)).success;
				},
				type: (data) =>
					z
						.enum(['boolean', 'number', 'text', 'textarea', 'checkbox', 'radio', 'select'])
						.safeParse(data).success
			}
		});

		export type QuestionData = typeof Questions.sample;

		Questions.on('delete', async (data) => {
			Answers.fromProperty('questionId', data.id, {
				type: 'stream'
			}).pipe((d) => d.delete());
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
			},
			validators: {
				answer: (data) => {
					if (typeof data !== 'string') return false;
					return z.array(z.string()).safeParse(JSON.parse(data)).success;
				}
			}
		});

		export type AnswerData = typeof Answers.sample;

		Answers.queryListen('from-group', async (event, data) => {
			const session = (await Session.getSession(event)).unwrap();
			const account = (await Session.getAccount(session)).unwrap();
			if (!account) throw new Error('Not logged in');

			const roles = (await Permissions.allAccountRoles(account)).unwrap();

			if (!Permissions.isEntitled(roles, 'view-pit-scouting', 'manage-pit-scouting'))
				throw new Error('Not entitled');

			const { group } = z
				.object({
					group: z.string()
				})
				.parse(data);

			const g = (await Groups.fromId(group)).unwrap();
			if (!g) throw new Error('Group not found');

			const res = (await getAnswersFromGroup(g)).unwrap();

			const stream = new StructStream(Answers);

			setTimeout(() => {
				for (const r of res) stream.add(r);
			}, 10);

			return stream;
		});

		export const getScoutingInfo = (team: number, eventKey: string) => {
			return attemptAsync(async () => {
				const res = await DB.select()
					.from(Questions.table)
					.innerJoin(Groups.table, eq(Questions.table.groupId, Groups.table.id))
					.innerJoin(Sections.table, eq(Groups.table.sectionId, Sections.table.id))
					.where(eq(Sections.table.eventKey, eventKey));

				const questions = res
					.map((q) => Questions.Generator(q.pit_questions))
					.filter((q, i, a) => a.findIndex((qq) => q.id === qq.id) === i)
					.filter((a) => !a.archived);
				const groups = res
					.map((q) => Groups.Generator(q.pit_groups))
					.filter((q, i, a) => a.findIndex((qq) => q.id === qq.id) === i)
					.filter((a) => !a.archived);
				const sections = res
					.map((q) => Sections.Generator(q.pit_sections))
					.filter((q, i, a) => a.findIndex((qq) => q.id === qq.id) === i)
					.filter((a) => !a.archived);

				const answers = (
					await Answers.fromProperty('team', team, { type: 'stream' }).await()
				).unwrap();

				return {
					questions,
					groups,
					sections,
					answers: await Promise.all(
						answers
							.filter((a) => a.data.team === team)
							.map(async (a) => {
								const account = (await Account.Account.fromId(a.data.accountId)).unwrap();
								return {
									answer: a,
									account
								};
							})
					)
				};
			});
		};

		export const getScoutingInfoFromSection = (team: number, section: SectionData) => {
			return attemptAsync(async () => {
				const groups = (
					await Groups.fromProperty('sectionId', section.id, {
						type: 'stream'
					}).await()
				).unwrap();

				const questions = resolveAll(
					await Promise.all(
						groups.map((g) => Questions.fromProperty('groupId', g.id, { type: 'stream' }).await())
					)
				)
					.unwrap()
					.flat();
				const answers = resolveAll(
					await Promise.all(
						questions.map((q) =>
							Answers.fromProperty('questionId', q.id, { type: 'stream' }).await()
						)
					)
				)
					.unwrap()
					.flat();

				return {
					questions,
					groups,
					answers: await Promise.all(
						answers
							.filter((a) => a.data.team === team)
							.map(async (a) => {
								const account = (await Account.Account.fromId(a.data.accountId)).unwrap();
								return {
									answer: a,
									account
								};
							})
					)
				};
			});
		};

		export const getAnswersFromGroup = (group: GroupData) => {
			return attemptAsync(async () => {
				const res = await DB.select()
					.from(Answers.table)
					.innerJoin(Questions.table, eq(Questions.table.id, Answers.table.questionId))
					.where(eq(Questions.table.groupId, group.id));

				return res.map((r) => Answers.Generator(r.pit_answers));
			});
		};

		Sections.callListen('generate-event-template', async (event, data) => {
			const session = (await Session.getSession(event)).unwrap();
			const account = (await Session.getAccount(session)).unwrap();
			if (!account) {
				terminal.error('Not logged in');
				return {
					success: false,
					message: 'Not logged in'
				};
			}

			const roles = (await Permissions.allAccountRoles(account)).unwrap();
			if (!Permissions.isEntitled(roles, 'manage-pit-scouting')) {
				terminal.error('Not entitled');
				return {
					success: false,
					message: 'Not entitled'
				};
			}

			const parsed = z
				.object({
					eventKey: z.string()
				})
				.safeParse(data);

			if (!parsed.success) {
				terminal.error('Invalid data', parsed.error);
				return {
					success: false,
					message: 'Invalid data'
				};
			}

			const res = await generateBoilerplate(parsed.data.eventKey, account.id);

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
		});

		Sections.callListen('copy-from-event', async (event, data) => {
			const session = (await Session.getSession(event)).unwrap();
			const account = (await Session.getAccount(session)).unwrap();
			if (!account) {
				terminal.error('Not logged in');
				return {
					success: false,
					message: 'Not logged in'
				};
			}
			const roles = (await Permissions.allAccountRoles(account)).unwrap();
			if (!Permissions.isEntitled(roles, 'manage-pit-scouting')) {
				terminal.error('Not entitled');
				return {
					success: false,
					message: 'Not entitled'
				};
			}

			const parsed = z
				.object({
					from: z.string(),
					to: z.string()
				})
				.safeParse(data);

			if (!parsed.success) {
				terminal.error('Invalid data', parsed.error);
				return {
					success: false,
					message: 'Invalid data'
				};
			}

			const res = await copyFromEvent(parsed.data.from, parsed.data.to, account.id);
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
		});

		export const generateBoilerplate = async (eventKey: string, accountId: string) => {
			return attemptAsync(async () => {
				const sections = (
					await Sections.fromProperty('eventKey', eventKey, {
						type: 'stream'
					}).await()
				).unwrap();
				if (sections.length) throw new Error('Cannot generate boilerplate for existing sections');

				const log = (struct: string, message: string, id: string) =>
					Logs.log({
						struct,
						message,
						accountId,
						type: 'create',
						dataId: id
					});
				const [
					general,
					// mech,
					electrical
				] = await Promise.all([
					Sections.new({
						name: 'General',
						eventKey,
						order: 0
					}),
					// Sections.new({
					// 	name: 'Mechanical',
					// 	eventKey,
					// 	order: 1
					// }),
					Sections.new({
						name: 'Electrical',
						eventKey,
						order: 2
					})
				]);

				const genSection = general.unwrap();
				// const mechSection = mech.unwrap();
				const electSection = electrical.unwrap();

				log(Sections.name, `Created General section for ${eventKey}`, genSection.id);
				// log(Sections.name, `Created Mechanical section for ${eventKey}`, mechSection.id);
				log(Sections.name, `Created Electrical section for ${eventKey}`, electSection.id);

				// TODO: Write boilerplate groups/questions
				const [overviewRes, strategyRes, gameplayRes, summaryRes] = await Promise.all([
					Groups.new({
						sectionId: genSection.id,
						name: 'Overview',
						order: 0
					}),
					Groups.new({
						sectionId: genSection.id,
						name: 'Strategy',
						order: 1
					}),
					Groups.new({
						sectionId: genSection.id,
						name: 'Gameplay',
						order: 2
					}),
					Groups.new({
						sectionId: genSection.id,
						name: 'Summary',
						order: 3
					})
				]);

				const [eProtectedRes, eOverviewRes] = await Promise.all([
					Groups.new({
						sectionId: electSection.id,
						name: 'Protected',
						order: 0
					}),
					Groups.new({
						sectionId: electSection.id,
						name: 'Electrical Overview',
						order: 1
					})
				]);

				const overview = overviewRes.unwrap();
				const strategy = strategyRes.unwrap();
				const gameplay = gameplayRes.unwrap();
				const summary = summaryRes.unwrap();
				const eOverview = eOverviewRes.unwrap();
				const eProtected = eProtectedRes.unwrap();

				log(Groups.name, `Created Overview group for ${eventKey}`, overview.id);
				log(Groups.name, `Created Strategy group for ${eventKey}`, strategy.id);
				log(Groups.name, `Created Gameplay group for ${eventKey}`, gameplay.id);
				log(Groups.name, `Created Summary group for ${eventKey}`, summary.id);
				log(Groups.name, `Created Electrical Overview group for ${eventKey}`, eOverview.id);
				log(Groups.name, `Created Protected group for ${eventKey}`, eProtected.id);

				const res = resolveAll(
					await Promise.all([
						Questions.new({
							question: 'What is your favorite part of the robot, or what are you most proud of?',
							groupId: overview.id,
							key: 'favorite',
							description:
								'This could be a mechanism, a programming feature, design choice, team dynamic, etc.',
							type: 'textarea',
							options: '[]',
							order: 0
						}),
						Questions.new(
							{
								question: 'What is the inspection weight?',
								groupId: overview.id,
								key: 'robot_weight',
								description: 'The inspection weight in lbs',
								type: 'number',
								options: '[]',
								order: 1
							},
							{
								static: true
							}
						),
						Questions.new(
							{
								question: 'What is the robot width',
								groupId: overview.id,
								key: 'robot_width',
								description: 'The robot width in inches',
								type: 'number',
								options: '[]',
								order: 2
							},
							{
								static: true
							}
						),
						Questions.new(
							{
								question: 'What is the robot length',
								groupId: overview.id,
								key: 'robot_length',
								description: 'The robot length in inches',
								type: 'number',
								options: '[]',
								order: 3
							},
							{
								static: true
							}
						),
						Questions.new(
							{
								question: 'What is the drive train type?',
								groupId: overview.id,
								key: 'robot_drivetrain',
								description: 'Swerve, Tank, Mecanum, etc.',
								type: 'text',
								options: '[]',
								order: 4
							},
							{
								static: true
							}
						),
						Questions.new(
							{
								question: 'How much drive practice has your driver had?',
								groupId: overview.id,
								key: 'robot_drive_practice',
								description: 'In hours. Assume around 4h per regional if they answer with that.',
								type: 'text',
								options: '[]',
								order: 5
							},
							{
								static: true
							}
						),
						Questions.new({
							question: 'What is the programming language you use?',
							groupId: overview.id,
							key: 'programmingLanguage',
							description: 'Java, C++, LabView, etc.',
							type: 'text',
							options: '[]',
							order: 6
						}),

						Questions.new({
							question: "What are your robot's key strengths?",
							groupId: strategy.id,
							key: 'strengths',
							description: 'What that robot can demonstrably deliver',
							type: 'textarea',
							options: '[]',
							order: 0
						}),
						Questions.new({
							question: 'Are there any trade-offs you made in the design process?',
							groupId: strategy.id,
							key: 'limitations',
							description:
								'Any design choices that were made to prioritize one aspect of the robot over another',
							type: 'textarea',
							options: '[]',
							order: 1
						}),

						Questions.new({
							question: 'Describe your autonomous capabilites',
							groupId: gameplay.id,
							key: 'auto',
							description: 'Are there multiple autos? What are their primary objectives?',
							type: 'textarea',
							options: '[]',
							order: 0
						}),
						Questions.new({
							question: 'Describe your teleop capabilites',
							groupId: gameplay.id,
							key: 'teleop',
							description:
								'What are your primary and secondary functionalities in teleop? Does this change between quals and elims?',
							type: 'textarea',
							options: '[]',
							order: 1
						}),
						Questions.new({
							question: 'What are your endgame capabilities?',
							groupId: gameplay.id,
							key: 'endgame',
							description:
								'How fast they can complete the endgame tasks, and how consistently they can do so.',
							type: 'textarea',
							options: '[]',
							order: 2
						}),

						Questions.new({
							question:
								'This is a question for you to answer, not to ask. What are some observations you noticed about the robot and/or the team?',
							groupId: summary.id,
							key: 'observations',
							description:
								'Do not ask this question to the team, this is for your own observations. Describe their attitude/dynamic, any concerns you see about their robot, etc. Feel free to leave this blank if you have nothing to say.',
							type: 'textarea',
							options: '[]',
							order: 1
						}),

						// Electrical
						Questions.new({
							question: 'Is the main breaker protected?',
							type: 'boolean',
							groupId: eProtected.id,
							key: 'breaker_secure',
							description:
								'If the main breaker could be hit by a game piece or another robot, please mark as no.',
							options: '[]',
							order: 0
						}),
						Questions.new({
							question: 'Is the RoboRIO protected?',
							type: 'boolean',
							groupId: eProtected.id,
							key: 'roborio_secure',
							description:
								'If the RoboRIO could have potential failures due to game pieces, other robots, or pieces of metal, please mark as no.',
							options: '[]',
							order: 1
						}),
						Questions.new({
							question: 'Is the battery secure?',
							type: 'boolean',
							groupId: eProtected.id,
							key: 'battery_secure',
							description:
								'If the battery could fall out or be hit by a game piece or another robot, please mark as no.',
							options: '[]',
							order: 1
						}),

						Questions.new({
							question: "Is the robot's electrical system generally accessible?",
							type: 'boolean',
							groupId: eOverview.id,
							key: 'electrical_access',
							description:
								'If the battery could fall out or be hit by a game piece or another robot, please mark as no.',
							options: '[]',
							order: 0
						}),
						Questions.new({
							question: 'Please rate the overall cleanliness of the electrical system',
							type: 'number',
							groupId: eOverview.id,
							key: 'electrical_cleanliness',
							description:
								"Rate between 1 and 10, 1 being a rat's nest and 10 being a professional wiring job.",
							options: '[]',
							order: 1
						}),
						Questions.new({
							question:
								'Overall, how well do you think the electrical system is integrated into the robot?',
							type: 'number',
							groupId: eOverview.id,
							key: 'electrical_rating',
							description: 'Rate between 1 and 10, 1 being terrible and 10 being perfect.',
							options: '[]',
							order: 2
						}),
						Questions.new({
							question: "Due to what you've seen, do you think this robot is a SpecTator?",
							type: 'boolean',
							groupId: eOverview.id,
							key: 'electrical_spectator',
							description:
								'If you believe the electrical system could have significant issues during a match, please mark as yes.',
							options: '[]',
							order: 3
						})
					])
				).unwrap();

				for (const q of res) {
					log(Questions.name, `Created question ${q.data.key} for ${eventKey}`, q.id);
				}
			});
		};

		export const copyFromEvent = async (
			fromEventKey: string,
			toEventKey: string,
			accountId: string
		) => {
			return attemptAsync(async () => {
				const log = (struct: string, message: string, id: string) =>
					Logs.log({
						struct,
						message,
						accountId,
						type: 'create',
						dataId: id
					});

				await Sections.fromProperty('eventKey', fromEventKey, {
					type: 'stream'
				}).pipe(async (s) => {
					const section = (
						await Sections.new({
							...s.data,
							eventKey: toEventKey
						})
					).unwrap();

					log(
						Sections.name,
						`Copied section ${s.data.name} from ${fromEventKey} to ${toEventKey}`,
						section.id
					);

					return Groups.fromProperty('sectionId', s.id, {
						type: 'stream'
					}).pipe(async (g) => {
						const group = (
							await Groups.new({
								...g.data,
								sectionId: section.id
							})
						).unwrap();

						log(
							Groups.name,
							`Copied group ${g.data.name} from ${fromEventKey} to ${toEventKey}`,
							group.id
						);

						return Questions.fromProperty('groupId', g.id, {
							type: 'stream'
						}).pipe(async (q) => {
							(
								await Questions.new({
									...q.data,
									groupId: group.id
								})
							).unwrap();

							log(
								Questions.name,
								`Copied question ${q.data.key} from ${fromEventKey} to ${toEventKey}`,
								q.id
							);
						});
					});
				});
			});
		};
		export const getAnswersFromTeam = (team: number, eventKey: string) => {
			return attemptAsync(async () => {
				const res = await DB.select()
					.from(Answers.table)
					.innerJoin(Questions.table, eq(Questions.table.id, Answers.table.questionId))
					.innerJoin(Groups.table, eq(Questions.table.groupId, Groups.table.id))
					.innerJoin(Sections.table, eq(Groups.table.sectionId, Sections.table.id))
					.where(and(eq(Answers.table.team, team), eq(Sections.table.eventKey, eventKey)));

				// return res.map((r) => Answers.Generator(r.pit_answers));

				return Promise.all(
					res.map(async (r) => ({
						answer: Answers.Generator(r.pit_answers),
						account: (await Account.Account.fromId(r.pit_answers.accountId)).unwrap()
					}))
				);
			});
		};

		export const getQuestionsFromEvent = (eventKey: string) => {
			return attemptAsync(async () => {
				const res = await DB.select()
					.from(Questions.table)
					.innerJoin(Groups.table, eq(Questions.table.groupId, Groups.table.id))
					.innerJoin(Sections.table, eq(Groups.table.sectionId, Sections.table.id))
					.where(eq(Sections.table.eventKey, eventKey));

				return res.map((r) => Questions.Generator(r.pit_questions));
			});
		};

		export const getAnswersFromEvent = (eventKey: string) => {
			return attemptAsync(async () => {
				const res = await DB.select()
					.from(Answers.table)
					.innerJoin(Questions.table, eq(Questions.table.id, Answers.table.questionId))
					.innerJoin(Groups.table, eq(Questions.table.groupId, Groups.table.id))
					.innerJoin(Sections.table, eq(Groups.table.sectionId, Sections.table.id))
					.where(eq(Sections.table.eventKey, eventKey));

				return res.map((r) => Answers.Generator(r.pit_answers));
			});
		};

		createEntitlement({
			name: 'view-pit-scouting',
			structs: [Sections, Groups, Questions, Answers],
			permissions: [
				'pit_sections:read:*',
				'pit_groups:read:*',
				'pit_questions:read:*',
				'pit_answers:*:*'
			],
			group: 'Scouting'
		});

		createEntitlement({
			name: 'manage-pit-scouting',
			structs: [Sections, Groups, Questions, Answers],
			permissions: ['*'],
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
