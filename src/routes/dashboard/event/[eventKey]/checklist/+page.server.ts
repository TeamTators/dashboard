import { FIRST } from '$lib/server/structs/FIRST.js';
import { Scouting } from '$lib/server/structs/scouting.js';
import { Event } from '$lib/server/utils/tba.js';
import terminal from '$lib/server/utils/terminal.js';
import { fail } from '@sveltejs/kit';
import { ServerCode } from 'ts-utils/status';

export const load = async (event) => {
	const e = await Event.getEvent(event.params.eventKey);
	if (e.isErr()) {
		terminal.error(e.error);
		throw fail(ServerCode.internalServerError);
	}

	const teams = await e.value.getTeams();
	if (teams.isErr()) {
		terminal.error(teams.error);
		throw fail(ServerCode.internalServerError);
	}

	return {
		event: e.value.tba,
		data: await Promise.all(
			teams.value
				.filter((team) => team.tba.team_number !== 2122)
				.map(async (team) => {
					const [answersRes, questionsRes] = await Promise.all([
						Scouting.PIT.getAnswersFromTeam(team.tba.team_number, event.params.eventKey),
						Scouting.PIT.getQuestionsFromEvent(event.params.eventKey)
					]);

					if (answersRes.isErr()) terminal.error(answersRes.error);
					if (questionsRes.isErr()) terminal.error(questionsRes.error);

					const answers = answersRes.isErr() ? [] : answersRes.value;
					const questions = questionsRes.isErr() ? [] : questionsRes.value;

					const pictures = await FIRST.getTeamPictures(
						team.tba.team_number,
						event.params.eventKey
					).unwrap();
					const tbaPictures = await team.getMedia().unwrap();

					return {
						team: team.tba,
						left: questions
							.filter((q) => !answers.some((a) => a.answer.data.questionId === q.id))
							.map((a) => a.safe()),
						uploaded: pictures.length,
						tba: tbaPictures.filter((p) => p.type === 'imgur').length
					};
				})
		)
	};
};
