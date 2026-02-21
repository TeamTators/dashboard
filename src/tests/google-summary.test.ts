/**
 * @fileoverview Integration test for google summary generation.
 * @description
 * Ensures the summary pipeline produces a serializable result.
 */

import { expect, test, describe } from 'vitest';
import { summarize } from '$lib/server/utils/google-summary';
import { DB } from '$lib/server/db';
import { resolveAll } from 'ts-utils/check';
import { TBA } from '$lib/server/structs/TBA';
import { Scouting } from '$lib/server/structs/scouting';

describe('Run google summary on 2025utwv', async () => {
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
	test('Google summary', async () => {
		const res = await (await summarize('2025utwv')).unwrap().serialize();
		expect(res.isOk()).toBe(true);
	}, 60_000);
});
