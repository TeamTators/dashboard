import { Client } from 'pg';
import { config } from 'dotenv';
import { getOldTables, testAll } from './old-tables';
import { Account } from '../../src/lib/server/structs/account';
import backup from '../backup';
import restore from '../restore';
import cliProgress from 'cli-progress';
import terminal from '../../src/lib/server/utils/terminal';
import { prompt } from '../../src/lib/server/cli/utils';
import { Logs } from '../../src/lib/server/structs/log';

const initDB = async () => {
	config();

	const { DB_OLD_HOST, DB_OLD_PORT, DB_OLD_USER, DB_OLD_PASS, DB_OLD_NAME } = process.env;
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

const reset = () => {
	return restore();
};

export default async () => {
	// (await Struct.buildAll(DB)).unwrap();
	const oldDB = await initDB();
	const old = getOldTables(oldDB);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const testRes = (await testAll(old as any)).unwrap();
	if (!testRes.every(Boolean)) {
		console.error('Tests failed');
		process.exit(1);
	}

	await backup();

	const streams: Promise<unknown>[] = [];

	const accountBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
	const { stream: accountStream, total: accountTotal } = (await old.Accounts.all()).unwrap();
	accountBar.start(accountTotal, 0);
	streams.push(accountStream.await());
	accountStream.pipe(async (a, i) => {
		accountBar.update(i);
		const exists = (await Account.Account.fromId(a.id)).unwrap();
		if (exists) return;
		terminal.log('Migrating account', a.username);
		const res = (
			await Account.Account.new({
				username: a.username,
				email: a.email,
				key: a.key,
				salt: a.salt,
				picture: a.picture || '/',
				verified: !!a.verified,
				firstName: a.first_name,
				lastName: a.last_name,
				verification: a.verification || ''
			})
		).unwrap();

		Logs.log({
			struct: 'Account',
			dataId: res.id,
			accountId: 'CLI',
			message: 'Migrated account',
			type: 'create',
		});
	});

	await accountStream.await();

	accountBar.stop();

	// const findAccount = async (user: string) => {
	//     return attemptAsync(async () => {
	//         const username = ((await Account.Account.fromId(user)).unwrap() || (await Account.Account.fromProperty('username', user, {
	//             type: 'single',
	//         })).unwrap())?.data.username || ((await old.Accounts.fromId(user)).unwrap() || (await old.Accounts.fromProperty('username', user)).unwrap()).username;
	//         const id = (await Account.Account.fromProperty('username', user, {
	//             type: 'single',
	//         })).unwrap()?.data.id;

	//         return { username, id };
	//     });
	// };

	// const msMap = new Map<string, string>();

	// const {stream: msStream, total: msTotal} = (await old.MatchScouting.all()).unwrap();
	// streams.push(msStream.await());
	// msStream.pipe(async ms => {
	//     const [match] = z.array(z.object({
	//         comp_level: z.enum(['qm', 'ef', 'qf', 'sf', 'f', 'pr']),
	//         event_key: z.string(),
	//         match_number: z.number().int(),
	//     })).parse(await oldDB.query(
	//         `SELECT
	//             comp_level,
	//             event_key,
	//             match_number
	//         FROM matches WHERE id = '${ms.match_id}';`
	//     ));

	//     if (!match) throw new Error('Match not found');

	//     const a = (await findAccount(ms.scout_id || '')).unwrap() || (await findAccount(ms.scout_name || '')).unwrap();

	//     const data = (await Scouting.MatchScouting.new({
	//         compLevel: match.comp_level,
	//         eventKey: match.event_key,
	//         matchNumber: match.match_number,
	//         team: ms.team,
	//         scoutId: a.id || '',
	//         scoutGroup: ms.scout_group,
	//         prescouting: !!ms.pre_scouting,
	//         remote: false,
	//         trace: ms.trace,
	//         checks: ms.checks,
	//         scoutUsername: a.username || '',
	//         alliance: '', // TODO: Calculate alliance
	//     })).unwrap();

	//     msMap.set(ms.id, data.data.id);
	// });

	// await msStream.await();

	// const { stream: tcStream, total: tcTotal } = (await old.TeamComments.all()).unwrap();
	// streams.push(tcStream.await());
	// tcStream.pipe(async tc => {
	//     const a = (await findAccount(tc.account_id || '')).unwrap();

	//     (await Scouting.TeamComments.new({
	//         team: tc.team,
	//         comment: tc.comment,
	//         accountId: a.id || '',
	//         matchScoutingId: tc.match_scouting_id,
	//         type: tc.type,
	//         eventKey: tc.event_key,
	//         scoutUsername: a.username || 'unknown',
	//     })).unwrap();
	// });

	// const { stream: stStream, total: stTotal } = (await old.Strategy.all()).unwrap();
	// streams.push(stStream.await());

	// stStream.pipe(async st => {
	//     (await Strategy.Strategy.new({
	//         name: st.name,
	//         createdBy: st.created_by,
	//         matchId: st.match_id || '',
	//         customMatchId: '',
	//         comment: st.comment,
	//     })).unwrap();
	// });

	// await stStream.await();

	// const { stream: wbStream, total: wbTotal } = (await old.Whiteboards.all()).unwrap();
	// streams.push(wbStream.await());
	// wbStream.pipe(async wb => {
	//     const strategy = (await Strategy.Strategy.fromId(wb.strategy_id)).unwrap();

	//     if (!strategy) return;

	//     (await Strategy.Whiteboards.new({
	//         strategyId: wb.strategy_id,
	//         board: wb.board,
	//         name: wb.name,
	//     })).unwrap();
	// });

	// await Promise.all(streams);

	// listen for enter to exit
	await prompt({
		message: 'Press any key to exit'
	});
};
