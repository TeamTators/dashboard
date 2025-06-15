import { expect, test, describe } from 'vitest';
import { summarize } from '$lib/server/utils/google-summary';
<<<<<<< HEAD
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
=======
import { openStructs } from '$lib/server/cli/struct';
import { Struct } from 'drizzle-struct/back-end';
import { DB } from '$lib/server/db';

describe('Run google summary on 2025utwv', async () => {
	(await openStructs()).unwrap();
	(await Struct.buildAll(DB)).unwrap();
>>>>>>> origin
	test('Google summary', async () => {
		const res = await (await summarize('2025utwv')).unwrap().serialize();
		expect(res.isOk()).toBe(true);
	}, 30_000);
});
