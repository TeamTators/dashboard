import { summarize } from '../src/lib/server/utils/google-summary';
import { openStructs } from '../cli/struct';
import { Struct } from 'drizzle-struct/back-end';
import { DB } from '../src/lib/server/db';

export default async (eventKey: string) => {
	await openStructs();
	await Struct.buildAll(DB);
	const data = await summarize(eventKey);
	if (data.isErr()) console.error(data.error);
	else console.log(await data.value.serialize());
};
