import { Event } from '../src/lib/server/utils/tba';
import { openStructs } from '../cli/struct';
import { Struct } from 'drizzle-struct/back-end';
import { DB } from '../src/lib/server/db';
import { Random } from 'ts-utils/math';

export default async () => {
	await openStructs();
	await Struct.buildAll(DB);
	const data = await Event.getEvent('2024utwv').unwrap();
	const matches = await data.getMatches().unwrap();
	console.log(JSON.stringify(matches, null, 2));
	// const m = (await data.getMatches()).unwrap().find((m) => m.teams.includes(2122));
	// console.log(JSON.stringify(m?.tba.score_breakdown, null, 2));
	// fs.writeFileSync(
	// 	path.join(__dirname, 'data.ts'),
	// 	`
	// 	import { z } from 'zod';
	// 	type Match2025 = ${toType(m?.tba)};

	// 	const match2025Schema = ${toZodType(m?.tba)};
	// `
	// );

	const thing: 'a' | 'b' | 'c' = Random.choose(['a', 'b', 'c']);

	switch (thing) {
		case 'a':
			console.log('This is the A case');
			break;
		case 'b':
			console.log('This is the B case');
			break;
		case 'c':
			console.log('This is the C case');
			break;
		default:
			console.log('This is the default case');
	}
};
