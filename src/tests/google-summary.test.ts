import { expect, test, describe } from 'vitest';
import { summarize } from '$lib/server/utils/google-summary';
import { openStructs } from '$lib/server/cli/struct';
import { Struct } from 'drizzle-struct/back-end';
import { DB } from '$lib/server/db';

describe('Run google summary on 2025utwv', async () => {
	(await openStructs()).unwrap();
	(await Struct.buildAll(DB)).unwrap();
	test('Google summary', async () => {
		const res = await (await summarize('2025utwv')).unwrap().serialize();
		expect(res.isOk()).toBe(true);
	}, 30_000);
});
