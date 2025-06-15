import { describe, expect, test } from 'vitest';
import * as TBA from '$lib/server/utils/tba';
import { Struct } from 'drizzle-struct/back-end';
import { DB } from '$lib/server/db';
import { generateScoutGroups, testAssignments } from 'tatorscout/scout-groups';

describe('Scout Groups', async () => {
	(await Struct.buildAll(DB)).unwrap();

	test('Get Scout Groups for 2024idbo', async () => {
		const event = (await TBA.Event.getEvent('2024idbo')).unwrap();
		const [teams, matches] = await Promise.all([event.getTeams(), event.getMatches()]);
		const assignments = generateScoutGroups(
			teams.unwrap().map((t) => t.tba),
			matches.unwrap().map((m) => m.tba)
		);
		const result = testAssignments(assignments);
		if (result.status !== 'ok') {
			throw new Error('Scout Groups Failed' + JSON.stringify(result));
		}
		expect(result.status).toBe('ok');
	});
});
