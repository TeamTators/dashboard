import { Account } from '$lib/server/structs/account.js';
import { Scouting } from '$lib/server/structs/scouting.js';
import { Event } from '$lib/server/utils/tba.js';
import { z } from 'zod';

export const GET = async (event) => {
	// auth(event);
	const data = await Scouting.PIT.getQuestionsFromEvent(event.params.eventKey).unwrap();

	const answers = await Scouting.PIT.getAnswersFromEvent(event.params.eventKey).unwrap();
	answers.sort((a, b) => a.data.team - b.data.team);

	const e = await Event.getEvent(event.params.eventKey).unwrap();
	const teams = await e.getTeams().unwrap();

	const accounts = await Account.Account.all({ type: 'stream' }).await().unwrap();

	const headers = ['Team Number', 'Team Name', 'Question', 'Key', 'Answer', 'Scout Username'];

	// Yes it's in a promise.all, but that's because in the future we may need to do some async stuff
	const res = await Promise.all(
		answers.map(async (a) => {
			const team = teams.find((t) => t.tba.team_number === a.data.team);
			const scout = accounts.find((t) => t.id === a.data.accountId);
			const question = data.find((d) => d.id === a.data.questionId);
			return [
				a.data.team,
				team?.tba.nickname,
				question?.data.question,
				question?.data.key,
				z.array(z.string()).parse(JSON.parse(a.data.answer)).join(', '),
				scout?.data.username
			];
		})
	);

	res.unshift(headers);
	return new Response(
		JSON.stringify({
			pitScouting: res
		}),
		{
			headers: {
				'Content-Type': 'application/json'
			}
		}
	);
};
