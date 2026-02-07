import { Struct } from 'drizzle-struct';
import { DB } from '../src/lib/server/db';
import { Scouting } from '../src/lib/server/structs/scouting';

export default async (eventKey: string) => {
	if (!eventKey) throw new Error('Event key parameter is required');
	(await Struct.buildAll(DB)).unwrap();

	await Scouting.MatchScouting.get(
		{ eventKey },
		{
			type: 'stream'
		}
	).pipe(async (s) => {
		if (s.data.compLevel === 'pr') s.setArchive(true);
	});
};
