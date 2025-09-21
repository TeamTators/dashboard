import { FIRST } from '$lib/model/FIRST.js';
import { Scouting } from '$lib/model/scouting';
import { DataArr } from '$lib/services/struct/data-arr';
import { Account } from '$lib/model/account';

export const load = (event) => {
	return {
		section: Scouting.PIT.Sections.Generator(event.data.section),
		eventKey: event.data.eventKey,
		sections: new DataArr(
			Scouting.PIT.Sections,
			event.data.sections.map((s) => Scouting.PIT.Sections.Generator(s))
		),
		teams: event.data.teams,
		team: event.data.team,
		sectionIndex: event.data.sectionIndex,
		event: event.data.event,
		questions: new DataArr(
			Scouting.PIT.Questions,
			event.data.questions.map((q) => Scouting.PIT.Questions.Generator(q))
		),
		answers: new DataArr(
			Scouting.PIT.Answers,
			event.data.answers.map((a) => Scouting.PIT.Answers.Generator(a.answer))
		),
		groups: new DataArr(
			Scouting.PIT.Groups,
			event.data.groups.map((g) => Scouting.PIT.Groups.Generator(g))
		),
		pictures: new DataArr(
			FIRST.TeamPictures,
			event.data.pictures.map((p) => FIRST.TeamPictures.Generator(p))
		),
		answeredAccounts: event.data.answers
			.map((a) => a.account)
			.filter(Boolean)
			.map((a) => Account.Account.Generator(a)),
		session: event.data.session,
	};
};
