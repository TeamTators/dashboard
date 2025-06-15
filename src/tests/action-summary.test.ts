import { expect, test, describe } from 'vitest';
import { openStructs } from '$lib/server/cli/struct';
import { Struct } from 'drizzle-struct/back-end';
import { DB } from '$lib/server/db';
import { actionSummary } from '$lib/server/utils/action-summary';

describe('Run action summary on 2025joh', async () => {
	(await openStructs()).unwrap();
	(await Struct.buildAll(DB)).unwrap();
	test('Action summary', async () => {
		const res = await (await actionSummary('2025joh', ['cl1']).unwrap()).serialize();
		expect(res.isOk()).toBe(true);
	}, 30_000);
});
