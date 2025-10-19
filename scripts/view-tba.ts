import { Event } from '../src/lib/server/utils/tba';
import { openStructs } from '../src/lib/server/cli/struct';
import { Struct } from 'drizzle-struct/back-end';
import { DB } from '../src/lib/server/db';
import { Random } from 'ts-utils/math';
import { match, matchInstance } from 'ts-utils/match';
import { toType, toZodType } from '../src/lib/utils/generate-type';
import fs from 'fs';
import path from 'path';

export default async () => {
	await openStructs();
	await Struct.buildAll(DB);
	const data = (await Event.getEvent('2025utwv')).unwrap();
	const m = (await data.getMatches()).unwrap().find((m) => m.teams.includes(2122));
	console.log(JSON.stringify(m?.tba.score_breakdown, null, 2));
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

	const someValue = match<'a' | 'b' | 'c', number>(thing)
		.case('a', () => 1)
		.case('b', () => 2)
		.case('c', () => 3)
		.default(() => 4)
		.exec()
		.unwrap();

	class MyThing {}

	const nextValue = match(typeof someValue)
		.case('string', (s) => 'hi')
		.case('number', () => 5)
		.exec()
		.unwrap();
};
