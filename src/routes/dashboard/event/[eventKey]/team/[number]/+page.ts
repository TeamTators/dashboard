import { DataArr } from '$lib/services/struct/data-arr';
import { Scouting } from '$lib/model/scouting';
import { FIRST } from '$lib/model/FIRST';
import { Account } from '$lib/model/account';

export const load = (event) => {
	const scouting = new DataArr(
		Scouting.MatchScouting,
		event.data.scouting.map((s) => Scouting.MatchScouting.Generator(s))
	);
	const comments = new DataArr(
		Scouting.TeamComments,
		event.data.comments.map((c) => Scouting.TeamComments.Generator(c))
	);
	const questions = new DataArr(
		Scouting.PIT.Questions,
		event.data.questions.map((q) => Scouting.PIT.Questions.Generator(q))
	);
	const groups = new DataArr(
		Scouting.PIT.Groups,
		event.data.groups.map((g) => Scouting.PIT.Groups.Generator(g))
	);
	const pictures = new DataArr(
		FIRST.TeamPictures,
		event.data.pictures.map((p) => FIRST.TeamPictures.Generator(p))
	);
	return {
		...event.data,
		scouting,
		comments,
		questions,
		groups,
		pictures,
		sections: event.data.sections.map((sess) => ({
			section: Scouting.PIT.Sections.Generator(sess.section),
			sessions: sess.sessions.map((sect) => ({
				session: Scouting.PIT.AnswerSessions.Generator(sect.section),
				account: sect.account ? Account.Account.Generator(sect.account) : undefined,
				answers: sect.answers.map((ans) => ({
					answer: Scouting.PIT.Answers.Generator(ans.answer),
					account: ans.account ? Account.Account.Generator(ans.account) : undefined
				}))
			}))
		}))
	};
};
