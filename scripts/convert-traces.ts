import { Scouting } from '../src/lib/server/structs/scouting';
import { Struct } from 'drizzle-struct/back-end';
import { DB } from '../src/lib/server/db';
import { Trace } from 'tatorscout/trace';

export default async () => {
	await Struct.buildAll(DB).unwrap();

	const matches = await Scouting.MatchScouting.all({
		type: 'all'
	}).unwrap();

	await Promise.all(
		matches.map(async (m) => {
			const trace = Trace.parse(m.data.trace).unwrap();
			await m
				.update({
					trace: trace.serialize(true)
				})
				.unwrap();
		})
	);
};
