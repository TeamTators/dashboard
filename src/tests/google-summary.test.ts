/**
 * @fileoverview Integration test for google summary generation.
 * @description
 * Ensures the summary pipeline produces a serializable result.
 */

import { expect, test, describe } from 'vitest';
import { summarize as summarize2025 } from '$lib/server/utils/google-summary/2025';
import { summarize as summarize2026 } from '$lib/server/utils/google-summary/2026';
import { DB } from '$lib/server/db';
import { resolveAll } from 'ts-utils/check';
import { TBA } from '$lib/server/structs/TBA';
import { Scouting } from '$lib/server/structs/scouting';

describe('Multi Year Google Summary', async () => {
	resolveAll(
		await Promise.all([
			TBA.Requests.build(DB),
			TBA.Events.build(DB),
			TBA.Teams.build(DB),
			TBA.Matches.build(DB),
			Scouting.MatchScouting.build(DB),
			Scouting.TeamComments.build(DB),
			Scouting.PIT.Answers.build(DB),
			Scouting.PIT.Questions.build(DB),
			Scouting.PIT.Groups.build(DB),
			Scouting.PIT.Sections.build(DB)
		])
	).unwrap();
	test('Summary for 2025utwv', async () => {
		const res = await (await summarize2025('2025utwv')).unwrap().serialize();
		expect(res.isOk()).toBe(true);
	}, 60_000);
	test('Summary for 2026idbo', async () => {
		const res  = await (await summarize2026('2026idbo')).unwrap().serialize();
		expect(res.isOk()).toBe(true);
	});
});
