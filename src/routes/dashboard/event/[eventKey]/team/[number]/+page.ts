import { DataArr } from 'drizzle-struct/front-end';
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
	const answers = new DataArr(
		Scouting.PIT.Answers,
		event.data.answers.map((a) => Scouting.PIT.Answers.Generator(a))
	);
	const questions = new DataArr(
		Scouting.PIT.Questions,
		event.data.questions.map((q) => Scouting.PIT.Questions.Generator(q))
	);
	const groups = new DataArr(
		Scouting.PIT.Groups,
		event.data.groups.map((g) => Scouting.PIT.Groups.Generator(g))
	);
	const sections = new DataArr(
		Scouting.PIT.Sections,
		event.data.sections.map((s) => Scouting.PIT.Sections.Generator(s))
	);
	const pictures = new DataArr(
		FIRST.TeamPictures,
		event.data.pictures.map((p) => FIRST.TeamPictures.Generator(p))
	);
	return {
		...event.data,
		scouting,
		comments,
		answers,
		questions,
		groups,
		sections,
		pictures,
		answerAccounts: event.data.answerAccounts.map((a) => Account.Account.Generator(a))
	};
};
