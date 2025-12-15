import { Client } from 'pg';
import { config } from 'dotenv';
import { getOldTables, testAll } from './old-tables';
import { Account } from '../../src/lib/server/structs/account';
import backup from '../backup';
import cliProgress from 'cli-progress';
import { prompt } from '../../cli/utils';
import { Logs } from '../../src/lib/server/structs/log';
import { attemptAsync, resolveAll } from 'ts-utils/check';
import { Scouting } from '../../src/lib/server/structs/scouting';
import { z } from 'zod';
import { Struct } from 'drizzle-struct/back-end';
import { openStructs } from '../../cli/struct';
import { postBuild } from '../../src/lib/server/index';
import { num, str } from '../../src/lib/server/utils/env';

const initDB = async () => {
	config();

	const DB_OLD_HOST = str('DB_OLD_HOST', false);
	const DB_OLD_PORT = num('DB_OLD_PORT', false);
	const DB_OLD_USER = str('DB_OLD_USER', false);
	const DB_OLD_PASS = str('DB_OLD_PASS', false);
	const DB_OLD_NAME = str('DB_OLD_NAME', false);

	const DB = new Client({
		user: DB_OLD_USER,
		database: DB_OLD_NAME,
		password: DB_OLD_PASS,
		port: Number(DB_OLD_PORT),
		host: DB_OLD_HOST,
		keepAlive: true
	});

	await DB.connect();
	return DB;
};

export default async () => {
	const oldDB = await initDB();
	const old = getOldTables(oldDB);

	// Struct.setupLogger(path.resolve(process.cwd(), 'logs', 'migration'));

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const testRes = (await testAll(old as any)).unwrap();
	if (!testRes.every(Boolean)) {
		console.error('Tests failed');
		process.exit(1);
	}

	await openStructs();

	await backup();

	resolveAll(await Promise.all(Array.from(Struct.structs).map(([, s]) => s.clear()))).unwrap();

	await postBuild();
	const accountBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
	const msBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
	const tcBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

	const sectionBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
	const groupBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
	const questionBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
	const answerBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

	const { stream: accountStream, total: accountTotal } = (await old.Accounts.all()).unwrap();

	accountBar.start(accountTotal, 0);
	msBar.start(0, 0);
	tcBar.start(0, 0);
	sectionBar.start(0, 0);
	groupBar.start(0, 0);
	questionBar.start(0, 0);
	answerBar.start(0, 0);

	accountStream.pipe(async (a) => {
		accountBar.increment();
		const exists = (await Account.Account.fromId(a.id)).unwrap();
		if (exists) return;
		const res = (
			await Account.Account.new(
				{
					username: a.username,
					email: a.email,
					key: a.key,
					salt: a.salt,
					verified: false,
					firstName: a.first_name,
					lastName: a.last_name,
					verification: '',
					lastLogin: new Date().toISOString()
				},
				{
					source: 'migration'
				}
			)
		).unwrap();

		if (a.verified) (await Account.verify(res)).unwrap();

		Logs.log({
			struct: Account.Account.data.name,
			dataId: res.id,
			accountId: 'CLI',
			message: 'Migrated account',
			type: 'create'
		});
	});

	await accountStream.await();

	accountBar.stop();

	const findAccount = async (user: string) => {
		return attemptAsync(async () => {
			const username =
				(
					(await Account.Account.fromId(user)).unwrap() ||
					(
						await Account.Account.fromProperty('username', user, {
							type: 'single'
						})
					).unwrap()
				)?.data.username ||
				(
					(await old.Accounts.fromId(user)).unwrap() ||
					(await old.Accounts.fromProperty('username', user)).unwrap()
				)?.username;
			const id = (
				await Account.Account.fromProperty('username', user, {
					type: 'single'
				})
			).unwrap()?.data.id;

			return { username, id };
		});
	};

	let totalComments = 0;
	const matchScoutingRes = await oldDB.query(`
		SELECT 
			accounts.username,
			match_scouting.*,
			matches.event_key,
			matches.match_number,
			matches.comp_level
		FROM match_scouting
		INNER JOIN matches ON match_scouting.match_id = matches.id
		INNER JOIN accounts ON match_scouting.scout_id = accounts.id OR match_scouting.scout_name = accounts.username;
	`);

	msBar.setMaxListeners(matchScoutingRes.rows.length);

	await Promise.all(
		matchScoutingRes.rows.map(async (ms) => {
			msBar.increment();
			const parsed = z
				.object({
					team: z.number().int(),
					scout_group: z.number().int(),
					time: z.string(),
					trace: z.string(),
					checks: z.string(),
					scout_name: z.string(),
					username: z.string().optional(),
					pre_scouting: z.number().int(),
					event_key: z.string(),
					match_number: z.number().int(),
					comp_level: z.string()
				})
				.safeParse(ms);

			if (!parsed.success) return console.error(parsed.error);

			const trace = z
				.array(
					z.tuple([
						z.number().nullable(),
						z.number().nullable(),
						z.number().nullable(),
						z.union([z.number(), z.string()]).nullable()
					])
				)
				.parse(JSON.parse(parsed.data.trace))
				.map((t) => [
					t[0] === null ? 0 : t[0],
					t[1] === null ? 0 : t[1],
					t[2] === null ? 0 : t[2],
					t[3] === null ? 0 : t[3] === '0' ? 0 : t[3]
				]);

			const a = (await findAccount(ms.username || '')).unwrap();

			const dataRes = await Scouting.MatchScouting.new({
				compLevel: ms.comp_level,
				eventKey: ms.event_key,
				matchNumber: ms.match_number,
				team: ms.team,
				scoutId: a.id || '',
				scoutGroup: ms.scout_group,
				prescouting: !!ms.pre_scouting,
				remote: false,
				trace: JSON.stringify(trace),
				checks: ms.checks,
				scoutUsername: a.username || '',
				alliance: '', // TODO: Calculate alliance
				year: Number(ms.event_key.slice(0, 4)),
				sliders: '[]'
			});

			if (dataRes.isErr()) return;

			Logs.log({
				struct: Scouting.MatchScouting.data.name,
				dataId: dataRes.value.id,
				accountId: 'CLI',
				message: 'Migrated Match Scouting',
				type: 'create'
			});

			const comments = await oldDB.query(`
			SELECT * FROM team_comments WHERE match_scouting_id = '${ms.id}';	
		`);

			totalComments += comments.rows.length;
			tcBar.setTotal(totalComments);

			return Promise.all(
				comments.rows.map(async (c) => {
					const res = (
						await Scouting.TeamComments.new({
							team: c.team,
							comment: c.comment,
							accountId: a.id || '',
							matchScoutingId: dataRes.value.id,
							type: c.type,
							eventKey: c.event_key,
							scoutUsername: a.username || 'unknown'
						})
					).unwrap();

					Logs.log({
						struct: Scouting.TeamComments.data.name,
						dataId: res.id,
						accountId: 'CLI',
						message: 'Migrated Team Comment',
						type: 'create'
					});

					tcBar.increment();
				})
			);
		})
	);

	matchScoutingRes.rows = [];

	msBar.stop();
	tcBar.stop();

	const sections = await oldDB.query('SELECT * FROM scouting_question_sections;');
	sectionBar.setTotal(sections.rows.length);

	let totalGroups = 0;
	let totalQuestions = 0;
	let totalAnswers = 0;

	const eventsDone = new Map<string, Scouting.PIT.SectionData[]>();

	const sectionType = z.object({
		id: z.string(),
		name: z.string(),
		multiple: z.number().int(),
		date_added: z.string(),
		account_id: z.string(),
		archived: z.boolean()
	});

	const groupType = z.object({
		id: z.string(),
		event_key: z.string(),
		section: z.string(),
		name: z.string(),
		date_added: z.string(),
		account_id: z.string(),
		archived: z.boolean()
	});

	const questionType = z.object({
		id: z.string(),
		question: z.string(),
		key: z.string(),
		description: z.string(),
		type: z.string(),
		group_id: z.string(),
		archived: z.boolean()
	});

	const answerType = z.object({
		id: z.string(),
		question_id: z.string(),
		answer: z.string(),
		team_number: z.number().int(),
		date: z.string(),
		account_id: z.string(),
		archived: z.boolean()
	});

	const generateSections = async (eventKey: string) => {
		const has = eventsDone.get(eventKey);
		if (has) return has;
		const res = await Promise.all(
			sections.rows.map(async (s: z.infer<typeof sectionType>, i) => {
				const sect = (
					await Scouting.PIT.Sections.new({
						eventKey,
						name: s.name,
						order: i
					})
				).unwrap();

				Logs.log({
					struct: Scouting.PIT.Sections.data.name,
					dataId: sect.data.id,
					accountId: 'CLI',
					message: 'Migrated Section',
					type: 'create'
				});

				return sect;
			})
		);
		eventsDone.set(eventKey, res);
		return res;
	};

	await Promise.all(
		sections.rows.map(async (sect) => {
			sectionBar.increment();
			const parsed = sectionType.safeParse(sect);

			if (!parsed.success) return console.error(parsed.error);

			const groups = await oldDB.query(`
			SELECT * FROM scouting_question_groups WHERE section = '${sect.id}';
		`);

			totalGroups += groups.rows.length;
			groupBar.setTotal(totalGroups);

			return Promise.all(
				groups.rows.map(async (g, i) => {
					groupBar.increment();
					const parsed = groupType.safeParse(g);
					if (!parsed.success) return console.error(parsed.error);

					const questions = await oldDB.query(`
				SELECT * FROM scouting_questions WHERE group_id = '${g.id}';
			`);

					if (!questions.rows.length) return;

					totalQuestions += questions.rows.length;
					questionBar.setTotal(totalQuestions);

					const sections = (await generateSections(g.event_key)).find(
						(s) => s.data.name === sect.name
					);
					if (!sections) return console.error('Section not found, this should not happen');

					const group = (
						await Scouting.PIT.Groups.new({
							name: g.name,
							sectionId: sections.data.id,
							order: i
						})
					).unwrap();

					Logs.log({
						struct: Scouting.PIT.Groups.data.name,
						dataId: group.data.id,
						accountId: 'CLI',
						message: 'Migrated Group',
						type: 'create'
					});

					return Promise.all(
						questions.rows.map(async (q, i) => {
							questionBar.increment();
							const parsed = questionType.safeParse(q);
							if (!parsed.success) return console.error(parsed.error);

							const answers = await oldDB.query(`
					SELECT * FROM scouting_answers WHERE question_id = '${q.id}';
				`);

							totalAnswers += answers.rows.length;
							answerBar.setTotal(totalAnswers);

							const question = (
								await Scouting.PIT.Questions.new({
									question: q.question,
									key: q.key,
									description: q.description,
									type: q.type,
									groupId: group.data.id,
									order: i,
									options: '[]'
								})
							).unwrap();

							Logs.log({
								struct: Scouting.PIT.Questions.data.name,
								dataId: question.data.id,
								accountId: 'CLI',
								message: 'Migrated Question',
								type: 'create'
							});

							return Promise.all(
								answers.rows.map(async (a) => {
									answerBar.increment();
									const parsed = answerType.safeParse(a);
									if (!parsed.success) return console.error(parsed.error);

									const account = (await findAccount(a.account_id)).unwrap();

									const res = (
										await Scouting.PIT.Answers.new({
											questionId: question.data.id,
											team: a.team_number,
											answer: a.answer,
											accountId: account.id || ''
										})
									).unwrap();

									Logs.log({
										struct: Scouting.PIT.Answers.data.name,
										dataId: res.id,
										accountId: 'CLI',
										message: 'Migrated Answer',
										type: 'create'
									});
								})
							);
						})
					);
				})
			);
		})
	);

	eventsDone.clear();
	sections.rows = [];

	// cleanup
	await Scouting.PIT.Sections.all({
		type: 'stream'
	}).pipe(async (s) => {
		const groups = (
			await Scouting.PIT.Groups.fromProperty('sectionId', s.id, {
				type: 'stream'
			}).await()
		).unwrap();
		let groupCount = groups.length;

		if (!groupCount) (await s.delete()).unwrap();

		await Promise.all(
			groups.map(async (g) => {
				const questions = (
					await Scouting.PIT.Questions.fromProperty('groupId', g.id, {
						type: 'stream'
					}).await()
				).unwrap();

				let questionCount = questions.length;

				if (!questionCount) {
					groupCount--;
					(await g.delete()).unwrap();
					if (!groupCount) (await s.delete()).unwrap();
				}

				await Promise.all(
					questions.map(async (q) => {
						const answers = (
							await Scouting.PIT.Answers.fromProperty('questionId', q.id, {
								type: 'stream'
							}).await()
						).unwrap();

						if (!answers.length) {
							questionCount--;
							(await q.delete()).unwrap();
							if (!questionCount) {
								groupCount--;
								(await g.delete()).unwrap();
								if (!groupCount) (await s.delete()).unwrap();
							}
						}
					})
				);
			})
		);
	});

	// listen for enter to exit
	await prompt({
		message: 'Press any key to exit'
	});
};
