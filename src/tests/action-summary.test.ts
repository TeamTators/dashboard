import { expect, test, describe } from 'vitest';
import { DB } from '$lib/server/db';
import { actionSummary } from '$lib/server/utils/action-summary';
import { resolveAll } from 'ts-utils/check';
import { TBA } from '$lib/server/structs/TBA';
import { Scouting } from '$lib/server/structs/scouting';

describe('Run action summary on 2025joh', async () => {
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
	test('Action summary', async () => {
		const res = await (await actionSummary('2025joh', ['cl1']).unwrap()).serialize();
		expect(res.isOk()).toBe(true);
	}, 30_000);
});
